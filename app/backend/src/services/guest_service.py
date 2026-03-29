from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.db.models.guest import Guest
from src.schemas.guest import GuestCreate, GuestUpdate


async def create_guest(db: AsyncSession, wedding_id: UUID, data: GuestCreate) -> Guest:
    """Create a guest for the given wedding, enforcing the max guest limit."""
    settings = get_settings()
    count_result = await db.execute(
        select(func.count()).select_from(Guest).where(Guest.wedding_id == wedding_id)
    )
    count = count_result.scalar_one()
    if count >= settings.MAX_GUESTS_PER_WEDDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Wedding has reached the maximum of {settings.MAX_GUESTS_PER_WEDDING} guests",
        )

    guest = Guest(wedding_id=wedding_id, **data.model_dump())
    db.add(guest)
    await db.commit()
    await db.refresh(guest)
    return guest


async def list_guests(db: AsyncSession, wedding_id: UUID) -> list[Guest]:
    """Return all guests belonging to the given wedding."""
    result = await db.execute(select(Guest).where(Guest.wedding_id == wedding_id))
    return list(result.scalars().all())


async def get_guest(db: AsyncSession, guest_id: UUID, wedding_id: UUID) -> Guest | None:
    """Return a guest only if it belongs to the given wedding."""
    result = await db.execute(
        select(Guest).where(Guest.id == guest_id, Guest.wedding_id == wedding_id)
    )
    return result.scalar_one_or_none()


async def update_guest(
    db: AsyncSession, guest_id: UUID, wedding_id: UUID, data: GuestUpdate
) -> Guest | None:
    """Partially update a guest. Returns None if not found or wrong wedding."""
    guest = await get_guest(db, guest_id, wedding_id)
    if guest is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(guest, field, value)

    await db.commit()
    await db.refresh(guest)
    return guest


async def delete_guest(db: AsyncSession, guest_id: UUID, wedding_id: UUID) -> bool:
    """Delete a guest. Returns True if deleted, False if not found or wrong wedding."""
    guest = await get_guest(db, guest_id, wedding_id)
    if guest is None:
        return False

    await db.delete(guest)
    await db.commit()
    return True
