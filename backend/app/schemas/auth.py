from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    name: str
    email: EmailStr


class TokenResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SignupResponse(BaseModel):
    message: str
    user: UserOut
