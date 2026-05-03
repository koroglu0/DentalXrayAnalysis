"""
Eski /uploads/ görsellerini S3'e taşı ve DynamoDB kayıtlarını güncelle
"""
import sys
import os
sys.path.insert(0, '.')

from config.settings import Config
from utils.dynamodb_client import dynamodb_client
from services.s3_service import s3_service

def migrate():
    table = dynamodb_client.dynamodb.Table(Config.ANALYSES_TABLE)
    resp = table.scan()
    analyses = resp.get('Items', [])

    migrated = 0
    skipped = 0

    for analysis in analyses:
        analysis_id = analysis.get('id')
        image_url = analysis.get('image_url', '')
        image_s3_key = analysis.get('image_s3_key', '')

        # Zaten S3 key varsa atla
        if image_s3_key and image_s3_key.startswith('xrays/'):
            print(f'SKIP (already migrated): {analysis_id}')
            skipped += 1
            continue

        # Eski /uploads/ yolu olan kayıtları işle
        if not image_url or not image_url.startswith('/uploads/'):
            print(f'SKIP (no local image_url): {analysis_id}')
            skipped += 1
            continue

        filename = os.path.basename(image_url)
        local_path = os.path.join(Config.UPLOAD_FOLDER, filename)

        if not os.path.exists(local_path):
            print(f'SKIP (file not found on disk): {local_path}')
            skipped += 1
            continue

        user_email = analysis.get('user_email', 'unknown')

        try:
            print(f'Uploading {filename} to S3 for {user_email}...')
            s3_key = s3_service.upload_xray(local_path, user_email, filename)
            print(f'  -> S3 key: {s3_key}')

            # DynamoDB güncelle
            table.update_item(
                Key={'id': analysis_id},
                UpdateExpression='SET image_s3_key = :key',
                ExpressionAttributeValues={':key': s3_key}
            )
            print(f'  -> DynamoDB updated for {analysis_id}')
            migrated += 1

        except Exception as e:
            print(f'ERROR for {analysis_id}: {e}')

    print(f'\nDone. Migrated: {migrated}, Skipped: {skipped}')

if __name__ == '__main__':
    migrate()
