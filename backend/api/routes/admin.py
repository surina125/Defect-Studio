from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy.orm import Session

from models import Member
from schema import TokenCreate, TokenUsageCreate, TokenReadByDepartment
from enums import Role
import crud
from dependencies import get_db, get_current_user

from typing import List
from functools import wraps

app = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

# role decorator
def role_required(allowed_roles: List[Role]):
    def decorator(func):
        @wraps(func)
        async def wrapper(current_user: Member =Depends(get_current_user), *args,  **kwargs):
            if current_user.role not in allowed_roles:
                raise HTTPException(status_code=403, detail="권한이 없습니다.")
            return await func(current_user=current_user, *args, **kwargs)
        return wrapper
    return decorator

# 토큰 발급
@app.post("/tokens")
@role_required([Role.super_admin]) # only super_admin can issue token
async def issue_token(token: TokenCreate,
                      session: Session = Depends(get_db),
                      current_user: Member = Depends(get_current_user)
                      ):
    members = crud.get_members_by_department_id(session, token.department_id)
    member_count = len(members)
    if token.quantity < member_count:
        raise HTTPException(status_code=400, detail="발급 토큰 수는 해당 부서의 회원 수보다 많아야 합니다.")

    crud.create_token(session, token)
    return HTTPException(status_code=201, detail="토큰이 발급되었습니다.")

# 관리자 토큰 조회
@app.get("/tokens", response_model=List[TokenReadByDepartment])
@role_required([Role.super_admin, Role.department_admin])
async def get_tokens(session: Session = Depends(get_db),
                      current_user: Member = Depends(get_current_user)):
    # 총관리자는 모든 토큰을 조회
    if current_user.role == Role.super_admin:
        return crud.get_tokens_for_super_admin(session)
    # 부서별 관리자는 해당 부서의 토큰만을 조회
    if current_user.role == Role.department_admin:
        return crud.get_tokens_for_department_admin(session, current_user.department_id)

# 토큰 분배
@app.post("/tokens/{token_id}")
@role_required([Role.department_admin]) # only department_admin can distribute token
async def distribute_token(token_id : int, quantity: int,
                           session: Session = Depends(get_db),
                           current_user : Member = Depends(get_current_user)
                           ):
    token = crud.get_token_by_token_id(session, token_id)

    members = crud.get_members_by_department_id(session, current_user.department_id)
    member_count = len(members)

    if quantity <= 0:
        raise HTTPException(status_code=422, detail="토큰 수는 0보다 커야 합니다.")

    if token.remain_quantity < quantity:
        raise HTTPException(status_code=422, detail="남아 있는 토큰 수보다 더 많은 양의 토큰을 지정할 수 없습니다.")

    if token.remain_quantity/member_count < quantity: # 토큰 수 / 회원 수 보다 작아야 함
        raise HTTPException(status_code=422, detail="모든 회원에게 분배할 수 없는 토큰 수입니다.")

    token.remain_quantity -= quantity * member_count
    session.add(token)

    for member in members:
        token_usage_create = TokenUsageCreate(
            quantity=quantity,
            start_date=token.start_date,
            end_date=token.end_date,
            member_id=member.member_id,
            token_id=token.token_id
        )
        crud.create_token_usage(session, token_usage_create) # token_usage 생성
        member.token_quantity += quantity # member의 token_quantity 갱신
        session.add(member)
    session.commit()

    return HTTPException(status_code=201, detail="토큰이 해당 부서의 회원들에게 분배되었습니다.")
