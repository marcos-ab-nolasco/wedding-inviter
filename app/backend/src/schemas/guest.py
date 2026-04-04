from datetime import datetime
from typing import ClassVar, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GuestCreate(BaseModel):
    name: str
    age_group: str | None = None
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
    age_group: str | None = None
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
    age_group: str | None = None
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


class InviteMessageVariation(BaseModel):
    tone: str
    message: str


class InviteMessageResponse(BaseModel):
    guest_id: UUID
    variations: list[InviteMessageVariation]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    history: list[ChatMessage]


class ChatResponse(BaseModel):
    message: str
    is_complete: bool
    invite_text: str | None = None
    fields_to_update: dict[str, str | None] | None = None
