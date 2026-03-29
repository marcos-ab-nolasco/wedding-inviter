from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.session import Base


class Guest(Base):
    """Guest model — one guest belonging to a wedding."""

    __tablename__ = "guests"

    id: Mapped[UUID] = mapped_column(
        Uuid, primary_key=True, server_default=func.gen_random_uuid(), index=True
    )
    wedding_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("weddings.id"), nullable=False, index=True
    )

    # Personal info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relationship_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_distant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # AI context fields (free-text strings — no DB enums)
    friendship_level: Mapped[str | None] = mapped_column(String(100), nullable=True)
    intimacy: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_contact_medium: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ideal_tone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    memory: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_element: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status fields
    invite_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    response_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    wedding: Mapped["Wedding"] = relationship("Wedding", back_populates="guests")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Guest(id={self.id}, name={self.name}, wedding_id={self.wedding_id})>"
