from datetime import datetime
from models import Member, Token, TokenUsage, Department
from fastapi import Depends
from schema import MemberCreate, TokenCreate, TokenUsageCreate, TokenRead, TokenReadByDepartment
from dependencies import get_db
from core.security import hash_password
from itertools import groupby
from typing import List

def get_member_by_login_id(session: Depends(get_db), login_id: str):
    return session.query(Member).filter(Member.login_id == login_id).first()

def get_members_by_department_id(session: Depends(get_db), department_id: int):
    return session.query(Member).filter(Member.department_id == department_id).all()

def create_member(session: Depends(get_db), member: MemberCreate):
    hashed_password = hash_password(member.password)
    db_member = Member(
        login_id=member.login_id,
        password=hashed_password,
        name=member.name,
        nickname=member.nickname,
        email=member.email,
        role=member.role,
        department_id=member.department_id
    )
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member

def create_token(session: Depends(get_db), token: TokenCreate):
    db_token = Token(
        start_date=datetime.today(),
        end_date=token.end_date,
        origin_quantity=token.quantity,
        remain_quantity=token.quantity,
        is_active=True, # 토큰 발급 시 활성화되어 발급됨
        department_id=token.department_id
    )

    session.add(db_token)
    session.commit()
    session.refresh(db_token)
    return db_token

def get_token_by_token_id(session: Depends(get_db), token_id: int):
    return session.query(Token).filter(Token.token_id == token_id).first()

def get_tokens_for_super_admin(session: Depends(get_db)):
    tokens = session.query(Token).all()
    return convert_to_token_read_by_department(session, tokens)


def get_tokens_for_department_admin(session: Depends(get_db), department_id: int):
    tokens = session.query(Token).filter(Token.department_id == department_id).all()
    return convert_to_token_read_by_department(session, tokens)

def convert_to_token_read_by_department(session: Depends(get_db), tokens: List[Token]):
    # 부서별로 토큰을 그룹화
    tokens_by_department = []
    tokens.sort(key=lambda x: x.department_id)
    for department_id, group in groupby(tokens, key=lambda x: x.department_id):
        department_name = session.query(Department.name).filter(Department.department_id == department_id).scalar()

        tokens_by_department.append(TokenReadByDepartment(
            department_id=department_id,
            department_name=department_name,
            tokens=[TokenRead.from_orm(token) for token in group]
        ))
    return tokens_by_department

def create_token_usage(session: Depends(get_db), token_usage: TokenUsageCreate):
    db_token_usage = TokenUsage(
        quantity=token_usage.quantity,
        start_date=token_usage.start_date,
        end_date=token_usage.end_date,
        member_id=token_usage.member_id,
        token_id=token_usage.token_id
    )

    session.add(db_token_usage)
    session.commit()
    session.refresh(db_token_usage)
    return db_token_usage
