from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class WeddingRead(BaseModel):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeddingMemberRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None

    model_config = ConfigDict(from_attributes=True)


class WeddingWithMembers(WeddingRead):
    members: list[WeddingMemberRead]


class InviteTokenResponse(BaseModel):
    invite_token: str
    invite_url: str
