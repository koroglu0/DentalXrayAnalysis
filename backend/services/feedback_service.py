"""
Doktor geri bildirim servisi - DynamoDB
"""
import uuid
from datetime import datetime
from config.settings import Config
from utils.dynamodb_client import dynamodb_client
from boto3.dynamodb.conditions import Key


class FeedbackService:
    """Doktorun hastaya gönderdiği geri bildirimler"""

    @staticmethod
    def create_feedback(analysis_id, doctor_email, doctor_name, patient_email, message):
        """Yeni geri bildirim oluştur"""
        feedback = {
            'id': str(uuid.uuid4()),
            'analysis_id': analysis_id,
            'doctor_email': doctor_email,
            'doctor_name': doctor_name,
            'patient_email': patient_email,
            'message': message,
            'is_read': False,
            'created_at': datetime.now().isoformat(),
        }
        table = dynamodb_client.dynamodb.Table(Config.FEEDBACKS_TABLE)
        table.put_item(Item=feedback)
        return feedback

    @staticmethod
    def get_patient_feedbacks(patient_email):
        """Hastanın aldığı geri bildirimleri getir"""
        table = dynamodb_client.dynamodb.Table(Config.FEEDBACKS_TABLE)
        response = table.query(
            IndexName='PatientEmailIndex',
            KeyConditionExpression=Key('patient_email').eq(patient_email),
        )
        items = response.get('Items', [])
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return items

    @staticmethod
    def get_unread_count(patient_email):
        """Okunmamış geri bildirim sayısı"""
        feedbacks = FeedbackService.get_patient_feedbacks(patient_email)
        return sum(1 for f in feedbacks if not f.get('is_read'))

    @staticmethod
    def mark_as_read(feedback_id):
        """Geri bildirimi okundu olarak işaretle"""
        table = dynamodb_client.dynamodb.Table(Config.FEEDBACKS_TABLE)
        table.update_item(
            Key={'id': feedback_id},
            UpdateExpression='SET is_read = :v',
            ExpressionAttributeValues={':v': True},
        )
