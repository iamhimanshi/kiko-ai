"""
Shape of a `users` document in MongoDB. Not a strict ODM — Motor works
with plain dicts — this just documents/validates the schema in one place.
"""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserInDB(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_mongo(self) -> dict:
        return self.model_dump()
