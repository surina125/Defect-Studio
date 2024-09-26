import io
import random
import zipfile
from typing import Optional, List

import requests
from fastapi import APIRouter, status, HTTPException, Response, Form, UploadFile, File, Depends
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from api.routes.members import use_tokens
from dependencies import get_db, get_current_user
from models import Member
from pathlib import Path

from core.config import settings
from enums import GPUEnvironment, SchedulerType, UseType
from schema.tokens import TokenUse
from utils.s3 import upload_files

router = APIRouter(
    prefix="/inpainting",
)

base_models = settings.BASE_MODEL_NAME.split("|")

@router.post("/{gpu_env}")
async def inpainting(
        gpu_env: GPUEnvironment,
        gpu_device: int = Form(..., description="사용할 GPU의 장치 번호"),
        session: Session = Depends(get_db),
        current_user: Member = Depends(get_current_user),
        model: str = Form(base_models[-1]),
        scheduler: Optional[SchedulerType] = Form(None, description="각 샘플링 단계에서의 노이즈 수준을 제어할 샘플링 메소드"),
        prompt: str = Form(..., description="이미지를 생성할 텍스트 프롬프트"),
        negative_prompt: Optional[str] = Form(None, description="네거티브 프롬프트", examples=[""]),
        width: Optional[int] = Form(512, description="생성할 이미지의 너비"),
        height: Optional[int] = Form(512, description="생성할 이미지의 높이"),
        num_inference_steps: Optional[int] = Form(50, ge=1, le=100, description="추론 단계 수"),
        guidance_scale: Optional[float] = Form(7.5, ge=1.0, le=20.0,
                                               description="모델이 텍스트 프롬프트에 얼마나 충실하게 이미지를 생성할지에 대한 수치 (0.0=프롬프트 벗어남, 10.0=프롬프트를 강하게 따름)"),
        strength: Optional[float] = Form(0.5, ge=0.0, le=1.0,
                                         description="초기 이미지와 얼마나 다르게 생성할지에 대한 수치 (0.0=초기 이미지 유지, 1.0=초기 이미지 무관)"),
        seed: Optional[int] = Form(-1, description="이미지 생성 시 사용할 시드 값 (랜덤 시드: -1)"),
        batch_count: Optional[int] = Form(1, ge=1, le=10, description="호출할 횟수"),
        batch_size: Optional[int] = Form(1, ge=1, le=10, description="한 번의 호출에서 생성할 이미지 수"),
        init_image_list: List[UploadFile] = File(..., description="초기 이미지 파일들, 페어인 마스킹 이미지의 업로드 순서와 동일해야합니다."),
        mask_image_list: List[UploadFile] = File(..., description="마스킹 이미지 파일들, 페어인 초기 이미지의 업로드 순서와 동일해야합니다."),
        init_input_path: Optional[str] = Form(None, description="초기 이미지를 가져올 로컬 경로", examples=[""]),
        mask_input_path: Optional[str] = Form(None, description="마스킹 이미지를 가져올 로컬 경로", examples=[""]),
        output_path: Optional[str] = Form(None, description="이미지를 저장할 로컬 경로", examples=[""])
):
    if gpu_env == GPUEnvironment.local:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="local 버전은 현재 준비중입니다.")

    cost = len(init_image_list) * batch_size * batch_count  # 토큰 차감 수
    # 토큰 개수 모자랄 경우 먼저 에러 처리
    if current_user.token_quantity < cost:
        raise HTTPException(status_code=400, detail="보유 토큰이 부족합니다.")

    if seed == -1:
        seed = random.randint(0, 2 ** 32 - 1)

    member_id = current_user.member_id
    model_name = model

    if model_name in base_models:
        model_path = model_name
    else:
        # TODO 해당 member_id에 존재하는 모델인지 검증 로직 필요
        model_path = Path(str(member_id)) / model_name

    form_data = {
        "model": model_path,
        "gpu_device": gpu_device,
        "scheduler": scheduler.value if scheduler else None,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "strength": strength,
        "seed": seed,
        "batch_count": batch_count,
        "batch_size": batch_size,
    }

    if len(init_image_list) != len(mask_image_list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="초기 이미지와 마스크 이미지의 개수가 동일해야 합니다.")

    files = []

    files.extend(
        [('init_image', (image.filename, await image.read(), image.content_type)) for image in init_image_list])
    files.extend(
        [('mask_image', (image.filename, await image.read(), image.content_type)) for image in mask_image_list])

    json_response = requests.post(settings.AI_SERVER_URL + "/generation/inpainting", files=files, data=form_data).json()
    return {"task_id": json_response.get("task_id")}
