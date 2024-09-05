from datetime import datetime

from pydantic import BaseModel, EmailStr, Field
import re
from models import *
from typing import Optional, List


class MemberCreate(BaseModel):
    login_id: str = Field(..., min_length=3, max_length=50)
    password: str = Field(pattern=re.compile(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$"))
    name: str = Field(..., min_length=3, max_length=100)
    nickname: str = Field(..., min_length=3, max_length=50, )
    email: EmailStr
    role: Role = Field(default=Role.department_member)
    department_id: int = Field(...)


class MemberRead(BaseModel):
    login_id: str
    nickname: str
    email: EmailStr
    role: Role
    department_name: str

    @classmethod
    def from_orm(cls, member: 'Member') -> 'MemberRead':
        return cls(
            login_id=member.login_id,
            nickname=member.nickname,
            email=member.email,
            role=member.role,
            department_name=member.department.name if member.department else "null"
        )

class MemberUpdate(BaseModel):
    password: Optional[str] = Field(None, pattern=re.compile(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$"))
    nickname: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

class TokenCreate(BaseModel):
    end_date: datetime = Field(...)
    quantity: int = Field(..., gt=0)
    department_id: int = Field(...)

class TokenUsageCreate(BaseModel):
    quantity: int
    start_date: datetime
    end_date: datetime
    member_id: int
    token_id: int

class TokenRead(BaseModel):
    token_id: int
    start_date: datetime
    end_date: datetime
    origin_quantity: int
    remain_quantity: int
    is_active: bool
    department_id: int

    @classmethod
    def from_orm(cls, token: 'Token') -> 'TokenRead':
        return cls(
            token_id=token.token_id,
            start_date=token.start_date,
            end_date=token.end_date,
            origin_quantity=token.origin_quantity,
            remain_quantity=token.remain_quantity,
            is_active=token.is_active,
            department_id=token.department_id
        )

class TokenReadByDepartment(BaseModel):
    department_id: int
    department_name: str
    tokens: List[TokenRead]
