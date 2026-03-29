---
name: event-driven-arch
description: Event-driven architecture — event design, handlers, reliability.
user-invocable: false
---

# Event-Driven Architecture

## Event Design
- Past tense naming: `UserCreated`, `OrderProcessed`
- Pydantic models with metadata: event_id, timestamp, correlation_id, schema_version
- Events must be idempotent or include idempotency key
```python
class UserCreatedEvent(BaseModel):
    event_id: str
    event_type: Literal["UserCreated"]
    schema_version: str = "1.0"
    timestamp: datetime
    user_id: int
    email: str
    correlation_id: str | None = None
```

## Event Handlers
- Decorator/registry pattern, outbox pattern for transactional messaging
- Check if event already processed (idempotency)
```python
@event_handler("UserCreated")
async def handle_user_created(event: UserCreatedEvent):
    try:
        await send_welcome_email(event.email)
    except Exception as e:
        logger.error(f"Failed: {e}", extra={"event_id": event.event_id})
        raise  # Retry via broker
```

## Reliability
- At-least-once (default) — requires idempotency
- Circuit breaker, retry with exponential backoff, dead letter queue

## Testing
- In-memory broker, reusable event fixtures, test handlers in isolation
