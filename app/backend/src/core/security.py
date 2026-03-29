import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from src.core.config import get_settings

# bcrypt cost factor (number of rounds = 2^cost)
BCRYPT_ROUNDS = 12


def _preprocess_password(password: str) -> bytes:
    """Preprocess password with SHA256 to handle bcrypt's 72-byte limit.

    This ensures long passwords maintain full entropy while staying within bcrypt's constraint.
    Returns bytes suitable for bcrypt.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with SHA256 preprocessing.

    The password is first hashed with SHA256 to handle bcrypt's 72-byte limit
    while preserving the full entropy of longer passwords.
    """
    preprocessed = _preprocess_password(password)
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(preprocessed, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    The password is first preprocessed with SHA256 before verification.
    """
    preprocessed = _preprocess_password(plain_password)
    return bcrypt.checkpw(preprocessed, hashed_password.encode("utf-8"))


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    settings = get_settings()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY.get_secret_value(), algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise ValueError("Could not validate credentials") from e


WEDDING_INVITE_TOKEN_EXPIRE_DAYS = 7


def create_wedding_invite_token(wedding_id: str) -> str:
    """Create a signed JWT invite token for a wedding (7-day expiry)."""
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(days=WEDDING_INVITE_TOKEN_EXPIRE_DAYS)
    to_encode = {"wedding_id": wedding_id, "exp": expire, "type": "wedding_invite"}
    return jwt.encode(
        to_encode, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM
    )


def decode_wedding_invite_token(token: str) -> str:
    """Decode invite token and return wedding_id string.

    Raises ValueError if the token is invalid, expired, or of the wrong type.
    """
    payload = decode_token(token)
    if payload.get("type") != "wedding_invite":
        raise ValueError("Invalid token type")
    wedding_id = payload.get("wedding_id")
    if not wedding_id:
        raise ValueError("Missing wedding_id in token")
    return str(wedding_id)
