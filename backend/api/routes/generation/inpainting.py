import mimetypes
import re
from pathlib import Path
from typing import Optional, List

import requests
from fastapi import APIRouter, status, HTTPException, Response, Form, UploadFile, File
from pydantic import ValidationError
from starlette.responses import JSONResponse

from api.routes.generation.schema import InpaintingRequest
from core.config import settings
from enums import GPUEnvironment
from utils.local_io import save_file_list_to_path
from utils.s3 import upload_files

router = APIRouter(
    prefix="/inpainting",
)


@router.post("/{gpu_env}")
def inpainting(
        gpu_env: str,  # GPU 환경 정보
        model: str = Form("diffusers/stable-diffusion-xl-1.0-inpainting-0.1"),
        prompt: str = Form(..., description="이미지를 생성할 텍스트 프롬프트"),
        negative_prompt: Optional[str] = Form(None, description="네거티브 프롬프트"),
        width: Optional[int] = Form(512, description="생성할 이미지의 너비"),
        height: Optional[int] = Form(512, description="생성할 이미지의 높이"),
        num_inference_steps: Optional[int] = Form(50, ge=1, le=100, description="추론 단계 수"),
        guidance_scale: Optional[float] = Form(7.5, ge=1.0, le=20.0,
                                               description="모델이 텍스트 프롬프트에 얼마나 충실하게 이미지를 생성할지에 대한 수치 (0.0=프롬프트 벗어남, 10.0=프롬프트를 강하게 따름)"),
        strength: Optional[float] = Form(0.5, ge=0.0, le=1.0,
                                         description="초기 이미지와 얼마나 다르게 생성할지에 대한 수치 (0.0=초기 이미지 유지, 1.0=초기 이미지 무관)"),
        num_images_per_prompt: Optional[int] = Form(1, description="각 프롬프트 당 생성할 이미지 수"),
        batch_count: Optional[int] = Form(1, ge=1, le=10, description="호출할 횟수"),
        batch_size: Optional[int] = Form(1, ge=1, le=10, description="한 번의 호출에서 생성할 이미지 수"),
        images: List[UploadFile] = File(..., description="업로드할 이미지 파일들"),
        init_input_path: Optional[str] = Form(None, description="초기 이미지를 가져올 로컬 경로"),
        mask_input_path: Optional[str] = Form(None, description="마스킹 이미지를 가져올 로컬 경로"),
        output_path: Optional[str] = Form(None, description="이미지를 저장할 로컬 경로")
):
    # TODO : 유저 인증 확인 후 토큰 사용

    form_data = {
        "model": model,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "strength": strength,
        "num_images_per_prompt": num_images_per_prompt,
        "batch_count": batch_count,
        "batch_size": batch_size,
    }

    # TODO : 이미지 넣기
    files = []

    response = requests.post(settings.AI_SERVER_URL + "/inpainting", files=files, data=form_data)

    if response.status_code != 200:
        return Response(status_code=response.status_code, content=response.content)

    response_data = response.json()
    image_list = response_data.get("image_list")

    # 로컬 GPU 사용 시 지정된 로컬 경로로 이미지 저장
    if gpu_env == GPUEnvironment.local:
        if save_file_list_to_path(output_path, image_list):
            return Response(status_code=status.HTTP_201_CREATED)

    # GPU 서버 사용 시 S3로 이미지 저장
    elif gpu_env == GPUEnvironment.remote:
        image_url_list = upload_files(image_list)
        return JSONResponse(status_code=status.HTTP_201_CREATED,
                            content={"image_list": image_url_list})
