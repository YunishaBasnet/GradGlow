from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.auth_schema import LoginRequest, TokenResponse
from backend.services.auth_service import (
    authenticate_user,
    create_access_token,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate a user",
    description=(
        "Verify a username and password and return a JWT access token."
    ),
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Invalid username or password",
        },
    },
)
def login(
    payload: LoginRequest,
    db: DatabaseSession,
) -> TokenResponse:
    """
    Authenticate a user and issue a JWT access token.
    """
    user = authenticate_user(
        db=db,
        username=payload.username,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role,
            "student_id": user.student_id,
        }
    )

    return TokenResponse(
        access_token=access_token,
        role=user.role,
        username=user.username,
        student_id=user.student_id,
    )