from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        examples=["advisor1"],
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        examples=["secure-password"],
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    student_id: str | None = None


class UserResponse(BaseModel):
    username: str
    role: str

    model_config = ConfigDict(from_attributes=True)