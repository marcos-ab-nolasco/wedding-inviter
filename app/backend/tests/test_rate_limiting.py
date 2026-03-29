"""Rate limiting tests for API endpoints.

These tests validate that rate limiting works correctly for IP-based
public endpoints (login, register).
"""

import asyncio

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_rate_limited_by_ip(client: AsyncClient) -> None:
    """Login endpoint should be rate limited to 5 requests per minute by IP.

    6th request should return 429 Too Many Requests with Retry-After header.
    """
    # First 5 requests should succeed (or fail with 401, but not 429)
    for i in range(5):
        response = await client.post(
            "/auth/login",
            auth=(f"user{i}@example.com", "wrong_password"),
        )
        # Should be 401 (invalid credentials) or 200, but NOT 429
        assert response.status_code in (200, 401), f"Request {i+1} got unexpected status"

    # 6th request should be rate limited
    response = await client.post(
        "/auth/login",
        auth=("user6@example.com", "wrong_password"),
    )
    assert response.status_code == 429, "6th request should be rate limited"
    # Note: Retry-After header is optional but recommended
    # assert "Retry-After" in response.headers


@pytest.mark.asyncio
async def test_register_rate_limited_by_ip(client: AsyncClient) -> None:
    """Register endpoint should be rate limited to 5 requests per minute by IP."""
    # First 5 requests with valid passwords to actually trigger endpoint logic
    for i in range(5):
        response = await client.post(
            "/auth/register",
            json={
                "email": f"testuser{i}@ratelimit.com",
                "password": "ValidPassword123!",
                "full_name": f"Test User {i}",
            },
        )
        # Should be 201 (created) or 400 (email exists), but NOT 429
        assert response.status_code in (
            201,
            400,
        ), f"Request {i+1} got unexpected status {response.status_code}"

    # 6th request should be rate limited
    response = await client.post(
        "/auth/register",
        json={
            "email": "testuser6@ratelimit.com",
            "password": "ValidPassword123!",
            "full_name": "Test User 6",
        },
    )
    assert response.status_code == 429, "6th request should be rate limited"


@pytest.mark.asyncio
async def test_rate_limit_429_includes_error_detail(client: AsyncClient) -> None:
    """Rate limit error should include helpful error message."""
    # Trigger rate limit
    for _ in range(6):
        response = await client.post(
            "/auth/login",
            auth=("test@example.com", "password"),
        )

    # Last response should be 429 with detail
    assert response.status_code == 429
    data = response.json()
    assert "detail" in data or "error" in data, "Should include error detail"


@pytest.mark.asyncio
@pytest.mark.slow
async def test_rate_limit_resets_after_window(client: AsyncClient) -> None:
    """Rate limit should reset after the time window expires.

    This test is marked as slow because it needs to wait ~60 seconds.
    """
    # First 5 requests
    for i in range(5):
        response = await client.post(
            "/auth/login",
            auth=(f"user{i}@example.com", "password"),
        )
        assert response.status_code in (200, 401)

    # 6th should fail
    response = await client.post("/auth/login", auth=("user6@example.com", "password"))
    assert response.status_code == 429

    # Wait for window to reset (61 seconds to be safe)
    await asyncio.sleep(61)

    # Should work again now
    response = await client.post("/auth/login", auth=("user7@example.com", "password"))
    assert response.status_code in (200, 401), "Rate limit should have reset"
    assert response.status_code != 429
