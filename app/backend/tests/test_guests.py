"""Tests for guest CRUD API endpoints."""

from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.guest import Guest
from src.db.models.user import User
from src.db.models.wedding import Wedding


@pytest.fixture
async def wedding(db_session: AsyncSession) -> Wedding:
    """Create a test wedding."""
    w = Wedding()
    db_session.add(w)
    await db_session.commit()
    await db_session.refresh(w)
    return w


@pytest.fixture
async def user_with_wedding(db_session: AsyncSession, wedding: Wedding) -> User:
    """Create a test user linked to a wedding."""
    from src.core.security import hash_password

    user = User(
        email="guest_test@example.com",
        hashed_password=hash_password("testpassword123"),
        full_name="Guest Test User",
        wedding_id=wedding.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_with_wedding(user_with_wedding: User) -> dict[str, str]:
    """Create authentication headers for a user with a wedding."""
    from src.core.security import create_access_token

    token = create_access_token(data={"sub": str(user_with_wedding.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def other_wedding(db_session: AsyncSession) -> Wedding:
    """Create another wedding for isolation tests."""
    w = Wedding()
    db_session.add(w)
    await db_session.commit()
    await db_session.refresh(w)
    return w


@pytest.fixture
async def other_user(db_session: AsyncSession, other_wedding: Wedding) -> User:
    """Create a user linked to a different wedding."""
    from src.core.security import hash_password

    user = User(
        email="other_user@example.com",
        hashed_password=hash_password("testpassword123"),
        full_name="Other User",
        wedding_id=other_wedding.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def guest_in_other_wedding(db_session: AsyncSession, other_wedding: Wedding) -> Guest:
    """Create a guest belonging to another wedding."""
    guest = Guest(
        wedding_id=other_wedding.id,
        name="Other Wedding Guest",
    )
    db_session.add(guest)
    await db_session.commit()
    await db_session.refresh(guest)
    return guest


@pytest.mark.asyncio
async def test_create_guest_returns_201(
    client: AsyncClient,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
) -> None:
    """POST /guests returns 201 with the created guest data."""
    payload = {
        "name": "Maria Silva",
        "nickname": "Mari",
        "city": "São Paulo",
        "state": "SP",
    }
    response = await client.post("/guests", json=payload, headers=auth_headers_with_wedding)

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Maria Silva"
    assert data["nickname"] == "Mari"
    assert data["city"] == "São Paulo"
    assert data["state"] == "SP"
    assert data["wedding_id"] == str(user_with_wedding.wedding_id)
    assert "id" in data
    assert data["invite_status"] == "pending"
    assert data["response_status"] == "pending"


@pytest.mark.asyncio
async def test_list_guests_returns_only_own_wedding_guests(
    client: AsyncClient,
    db_session: AsyncSession,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
    guest_in_other_wedding: Guest,
) -> None:
    """GET /guests returns only guests for the authenticated user's wedding."""
    # Create a guest for the current user's wedding
    own_guest = Guest(
        wedding_id=user_with_wedding.wedding_id,
        name="Own Wedding Guest",
    )
    db_session.add(own_guest)
    await db_session.commit()

    response = await client.get("/guests", headers=auth_headers_with_wedding)

    assert response.status_code == 200
    data = response.json()
    assert "guests" in data
    assert len(data["guests"]) == 1
    assert data["guests"][0]["name"] == "Own Wedding Guest"
    # Must not contain guest from other wedding
    guest_ids = [g["id"] for g in data["guests"]]
    assert str(guest_in_other_wedding.id) not in guest_ids


@pytest.mark.asyncio
async def test_update_guest_returns_updated_fields(
    client: AsyncClient,
    db_session: AsyncSession,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
) -> None:
    """PATCH /guests/{id} with partial body returns updated fields."""
    guest = Guest(
        wedding_id=user_with_wedding.wedding_id,
        name="Original Name",
        city="Rio de Janeiro",
    )
    db_session.add(guest)
    await db_session.commit()
    await db_session.refresh(guest)

    response = await client.patch(
        f"/guests/{guest.id}",
        json={"city": "Curitiba", "nickname": "Nick"},
        headers=auth_headers_with_wedding,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Curitiba"
    assert data["nickname"] == "Nick"
    assert data["name"] == "Original Name"  # Unchanged field preserved


@pytest.mark.asyncio
async def test_delete_guest_returns_204(
    client: AsyncClient,
    db_session: AsyncSession,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
) -> None:
    """DELETE /guests/{id} returns 204."""
    guest = Guest(
        wedding_id=user_with_wedding.wedding_id,
        name="To Be Deleted",
    )
    db_session.add(guest)
    await db_session.commit()
    await db_session.refresh(guest)

    response = await client.delete(f"/guests/{guest.id}", headers=auth_headers_with_wedding)

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_accessing_guest_from_another_wedding_returns_404(
    client: AsyncClient,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
    guest_in_other_wedding: Guest,
) -> None:
    """PATCH or DELETE for a guest from another wedding returns 404."""
    # Try to update a guest that belongs to a different wedding
    response = await client.patch(
        f"/guests/{guest_in_other_wedding.id}",
        json={"name": "Hacked Name"},
        headers=auth_headers_with_wedding,
    )
    assert response.status_code == 404

    # Try to delete it too
    response = await client.delete(
        f"/guests/{guest_in_other_wedding.id}",
        headers=auth_headers_with_wedding,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_guest_beyond_limit_returns_400(
    client: AsyncClient,
    user_with_wedding: User,
    auth_headers_with_wedding: dict[str, str],
) -> None:
    """POST /guests returns 400 when the max guest limit is reached."""
    with patch("src.services.guest_service.get_settings") as mock_settings:
        mock_settings.return_value.MAX_GUESTS_PER_WEDDING = 0

        response = await client.post(
            "/guests",
            json={"name": "Over The Limit"},
            headers=auth_headers_with_wedding,
        )

    assert response.status_code == 400
    assert "maximum" in response.json()["detail"].lower()
