from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    # ENVIRONMENT
    AWS_S3_BUCKET: str
    AWS_S3_REGION_STATIC: str
    AWS_S3_ACCESS_KEY: str
    AWS_S3_SECRET_KEY: str

settings = Settings()  # type: ignore
