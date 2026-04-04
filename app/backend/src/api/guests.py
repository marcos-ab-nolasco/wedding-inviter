import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user
from src.core.rate_limit import limiter_authenticated
from src.db.models.user import User
from src.db.session import get_db
from src.schemas.guest import (
    ChatRequest,
    ChatResponse,
    GuestCreate,
    GuestList,
    GuestRead,
    GuestUpdate,
    InviteMessageResponse,
)
from src.services import chat_service, guest_service, invite_service

router = APIRouter(prefix="/guests", tags=["guests"])

logger = logging.getLogger(__name__)


@router.post("", response_model=GuestRead, status_code=status.HTTP_201_CREATED)
@limiter_authenticated.limit("60/minute")
async def create_guest(
    request: Request,
    data: GuestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GuestRead:
    """Create a new guest for the authenticated user's wedding."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    guest = await guest_service.create_guest(db, current_user.wedding_id, data)
    logger.info(f"Guest created: guest_id={guest.id} wedding_id={current_user.wedding_id}")
    return GuestRead.model_validate(guest)


@router.get("", response_model=GuestList)
@limiter_authenticated.limit("60/minute")
async def list_guests(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GuestList:
    """List all guests for the authenticated user's wedding."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    guests = await guest_service.list_guests(db, current_user.wedding_id)
    return GuestList(guests=[GuestRead.model_validate(g) for g in guests])


@router.patch("/{guest_id}", response_model=GuestRead)
@limiter_authenticated.limit("60/minute")
async def update_guest(
    request: Request,
    guest_id: UUID,
    data: GuestUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GuestRead:
    """Partially update a guest belonging to the authenticated user's wedding."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    guest = await guest_service.update_guest(db, guest_id, current_user.wedding_id, data)
    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    logger.info(f"Guest updated: guest_id={guest_id} wedding_id={current_user.wedding_id}")
    return GuestRead.model_validate(guest)


@router.delete("/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter_authenticated.limit("60/minute")
async def delete_guest(
    request: Request,
    guest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a guest belonging to the authenticated user's wedding."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    deleted = await guest_service.delete_guest(db, guest_id, current_user.wedding_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    logger.info(f"Guest deleted: guest_id={guest_id} wedding_id={current_user.wedding_id}")


@router.post("/{guest_id}/invite-message", response_model=InviteMessageResponse)
@limiter_authenticated.limit("10/minute")
async def generate_invite_message(
    request: Request,
    guest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InviteMessageResponse:
    """Generate personalized WhatsApp invite message variations for a guest using AI."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    guest = await guest_service.get_guest(db, guest_id, current_user.wedding_id)
    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    guest_schema = GuestRead.model_validate(guest)
    variations = await invite_service.generate_invite_messages(guest_id, guest_schema)

    logger.info(f"Invite generated: guest_id={guest_id} wedding_id={current_user.wedding_id}")
    return InviteMessageResponse(guest_id=guest_id, variations=variations)


@router.post("/{guest_id}/chat", response_model=ChatResponse)
@limiter_authenticated.limit("30/minute")
async def chat_invite(
    request: Request,
    guest_id: UUID,
    data: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """Conversational invite writer — returns next chatbot message or final invite."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    guest = await guest_service.get_guest(db, guest_id, current_user.wedding_id)
    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    guest_schema = GuestRead.model_validate(guest)
    result = await chat_service.chat_turn(guest_schema, data.history)

    logger.info(
        f"Chat turn: guest_id={guest_id} wedding_id={current_user.wedding_id} "
        f"is_complete={result.is_complete}"
    )
    return result
