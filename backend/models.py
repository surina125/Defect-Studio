from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Boolean, Index

from enums import Role
from core.db import Base


class Department(Base):
    __tablename__ = 'department'

    department_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    members = relationship("Member", back_populates="department")
    tokens = relationship("Token", back_populates="department")

class Member(Base):
    __tablename__ = 'member'

    member_id = Column(Integer, primary_key=True)
    login_id = Column(String(50), nullable=False, unique=True)
    password = Column(String, nullable=False)
    name = Column(String(100), nullable=False)
    nickname = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=False)
    role = Column(Enum(Role), nullable=False)
    token_quantity = Column(Integer, nullable=False, default=0)
    department_id = Column(Integer, ForeignKey('department.department_id'))
    department = relationship("Department", back_populates="members")
    token_usages = relationship("TokenUsage", back_populates="member")

class Token(Base):
    __tablename__ = 'token'

    token_id = Column(Integer, primary_key=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    origin_quantity = Column(Integer, nullable=False)
    remain_quantity = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    department_id = Column(Integer, ForeignKey('department.department_id'))
    department = relationship("Department", back_populates="tokens")
    token_usages = relationship("TokenUsage", back_populates="token")

class TokenUsage(Base):
    __tablename__ = 'token_usage'
    __table_args__ = (Index('ix_member_id_end_date', 'member_id', 'end_date'),)

    usage_id = Column(Integer, primary_key=True)
    quantity = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    member_id = Column(Integer, ForeignKey('member.member_id'))
    member = relationship("Member", back_populates="token_usages")
    token_id = Column(Integer, ForeignKey('token.token_id'))
    token = relationship("Token", back_populates="token_usages")