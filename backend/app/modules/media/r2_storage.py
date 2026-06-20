import boto3
from app.core.config import settings
from app.modules.media.storage import StorageInterface


class R2Storage(StorageInterface):
    def _client(self):
        return boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        client = self._client()
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.R2_PUBLIC_BASE_URL}/{key}"

    async def delete(self, key: str):
        client = self._client()
        client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
