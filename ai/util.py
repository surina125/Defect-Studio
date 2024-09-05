from io import BytesIO
from typing import List

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from config import settings


def upload_file(s3_client, image_io: BytesIO, key: str) -> str:
    image_io.seek(0)
    try:
        s3_client.upload_fileobj(
            image_io,
            settings.AWS_S3_BUCKET,
            key,
            ExtraArgs={
                'ContentType': 'image/jpeg',
                'ContentDisposition': 'inline'
            }
        )
        s3_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_S3_REGION_STATIC}.amazonaws.com/{key}"
        return s3_url
    except (BotoCoreError, ClientError) as e:
        print(f"업로드 실패: {e}")
        return None


def delete_file(s3_client, key: str):
    try:
        s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=key)
        print(f"파일 삭제 성공: {key}")
    except (BotoCoreError, ClientError) as e:
        print(f"삭제 실패: {e}")


def upload_files(image_list: List[BytesIO]) -> List[str]:
    s3_urls = []
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_S3_SECRET_KEY
    )

    key = "temp"

    for index, image_io in enumerate(image_list):
        image_key = f"{key}/{index + 1}.jpeg"
        url = upload_file(s3_client, image_io, image_key)
        if url:
            s3_urls.append(url)

    return s3_urls


def delete_files(num_of_images: int, key: str):
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_S3_SECRET_KEY
    )

    for index in range(num_of_images):
        key_url = f"{key}/{index + 1}.jpeg"
        delete_file(s3_client, key_url)
