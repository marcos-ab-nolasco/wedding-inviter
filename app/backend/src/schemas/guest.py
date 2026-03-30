from datetime import datetime
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GuestCreate(BaseModel):
    name: str
    nickname: str | None = None
    relationship_type: str | None = None
    friendship_level: str | None = None
    intimacy: str | None = None
    contact_frequency: str | None = None
    last_contact_medium: str | None = None
    city: str | None = None
    state: str | None = None
    is_distant: bool = False
    memory: str | None = None
    shared_element: str | None = None
    ideal_tone: str | None = None
    notes: str | None = None
    invite_status: str = "pending"
    response_status: str = "pending"


class GuestRead(BaseModel):
    id: UUID
    wedding_id: UUID
    name: str
    nickname: str | None = None
    relationship_type: str | None = None
    friendship_level: str | None = None
    intimacy: str | None = None
    contact_frequency: str | None = None
    last_contact_medium: str | None = None
    city: str | None = None
    state: str | None = None
    is_distant: bool
    memory: str | None = None
    shared_element: str | None = None
    ideal_tone: str | None = None
    notes: str | None = None
    invite_status: str
    response_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuestUpdate(BaseModel):
    name: str | None = None
    nickname: str | None = None
    relationship_type: str | None = None
    friendship_level: str | None = None
    intimacy: str | None = None
    contact_frequency: str | None = None
    last_contact_medium: str | None = None
    city: str | None = None
    state: str | None = None
    is_distant: bool | None = None
    memory: str | None = None
    shared_element: str | None = None
    ideal_tone: str | None = None
    notes: str | None = None
    invite_status: str | None = None
    response_status: str | None = None

    # Fields that must not be set to null (DB NOT NULL constraint)
    _non_nullable_fields: ClassVar[frozenset[str]] = frozenset(
        {"name", "is_distant", "invite_status", "response_status"}
    )


class GuestList(BaseModel):
    guests: list[GuestRead]
