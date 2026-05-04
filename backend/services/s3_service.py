"""
AWS S3 servisi - Röntgen görüntülerini bulutta depola
"""
import os
import uuid
import boto3
from botocore.exceptions import ClientError
from config.settings import Config


class S3Service:
    """S3 yükleme, silme ve pre-signed URL servisi"""

    def __init__(self):
        self.client = boto3.client(
            's3',
            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
            region_name=Config.AWS_REGION,
        )
        self.bucket = Config.S3_BUCKET_NAME

    def upload_xray(self, local_path: str, user_email: str, original_filename: str) -> str:
        """
        Röntgeni S3'e yükle.

        Returns:
            str: S3 object key (örn. 'xrays/user@mail.com/uuid.jpg')

        Raises:
            Exception: Yükleme başarısız olursa
        """
        ext = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else 'jpg'
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        # E-posta adresindeki @ ve . karakterleri S3 key'de sorun çıkarmaz ama klasör olarak düzenlemek için @ → _at_
        safe_email = user_email.replace('@', '_at_').replace('.', '_')
        s3_key = f"xrays/{safe_email}/{unique_name}"

        content_type_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
        content_type = content_type_map.get(ext, 'image/jpeg')

        try:
            self.client.upload_file(
                local_path,
                self.bucket,
                s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'ServerSideEncryption': 'AES256',
                },
            )
            return s3_key
        except ClientError as e:
            raise Exception(f"S3 yükleme hatası: {e}") from e

    def download_xray(self, s3_key: str, local_path: str) -> bool:
        """
        S3'teki röntgeni yerel dosyaya indir.

        Returns:
            bool: Başarılıysa True
        """
        try:
            self.client.download_file(self.bucket, s3_key, local_path)
            return True
        except ClientError as e:
            print(f"S3 indirme hatası ({s3_key}): {e}")
            return False

    def generate_presigned_url(self, s3_key: str, expiry_seconds: int = 3600) -> str:
        """
        Geçici erişim URL'i oluştur (varsayılan 1 saat).

        Returns:
            str: Pre-signed URL veya hata durumunda boş string
        """
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': s3_key},
                ExpiresIn=expiry_seconds,
            )
            return url
        except ClientError as e:
            print(f"Pre-signed URL oluşturulamadı ({s3_key}): {e}")
            return ''

    def delete_object(self, s3_key: str) -> bool:
        """S3'teki dosyayı sil."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=s3_key)
            return True
        except ClientError as e:
            print(f"S3 silme hatası ({s3_key}): {e}")
            return False


s3_service = S3Service()
