---
name: fastapi-patterns
description: FastAPI best practices — routers, dependencies, testing, performance.
user-invocable: false
---

# FastAPI Patterns

## API Structure
- Routers: group endpoints, prefix paths. `Depends()` for auth, DB, services
- Lifespan context for startup/shutdown
- Pydantic models for all request/response bodies with Field constraints

## Dependency Injection
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
```

## Testing
```python
@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post("/api/v1/users", json={"email": "t@e.com"})
    assert response.status_code == 201
```
- Async TestClient, fixtures for DB/auth/mocks, test happy + error paths

## Database
- Indexes on frequently queried fields, `select_in_load`/`joined_load` (avoid N+1)
- Configure connection pool min/max, batch operations for bulk records

## Caching
- Redis for sessions/rate limiting, `lru_cache` for pure functions
- Namespaced keys (e.g., `user:123:profile`), TTL for time-sensitive data
