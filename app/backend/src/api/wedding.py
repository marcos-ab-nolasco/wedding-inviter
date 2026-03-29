import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.dependencies import get_current_user
from src.core.rate_limit import limiter
from src.core.security import create_wedding_invite_token
from src.db.models.user import User
from src.db.models.wedding import Wedding
from src.db.session import get_db
from src.schemas.wedding import InviteTokenResponse, WeddingWithMembers

router = APIRouter(prefix="/wedding", tags=["wedding"])

logger = logging.getLogger(__name__)


@router.post("/invite", response_model=InviteTokenResponse)
@limiter.limit("10/minute")
async def create_invite(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
) -> InviteTokenResponse:
    """Generate a signed invite link for the partner to join this wedding."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not linked to a wedding",
        )

    settings = get_settings()
    token = create_wedding_invite_token(str(current_user.wedding_id))
    invite_url = f"{settings.FRONTEND_BASE_URL}/register?invite={token}"

    logger.info(f"Invite generated: user_id={current_user.id} wedding_id={current_user.wedding_id}")

    return InviteTokenResponse(invite_token=token, invite_url=invite_url)


@router.get("/me", response_model=WeddingWithMembers)
async def get_my_wedding(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WeddingWithMembers:
    """Get the current user's wedding and its members."""
    if current_user.wedding_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No wedding found for this user",
        )

    result = await db.execute(select(Wedding).where(Wedding.id == current_user.wedding_id))
    wedding = result.scalar_one_or_none()
    if wedding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wedding not found",
        )

    members_result = await db.execute(
        select(User).where(User.wedding_id == current_user.wedding_id)
    )
    members = list(members_result.scalars().all())

    return WeddingWithMembers(
        id=wedding.id,
        created_at=wedding.created_at,
        updated_at=wedding.updated_at,
        members=members,
    )
