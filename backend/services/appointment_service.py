"""
Randevu servisi - DynamoDB
"""
import uuid
from datetime import datetime, date, timedelta
from config.settings import Config
from utils.dynamodb_client import dynamodb_client
from boto3.dynamodb.conditions import Key

# Çalışma saatleri: 09:00-17:00, 1 saat aralıkla
WORK_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
]


class AppointmentService:

    @staticmethod
    def get_available_slots(doctor_email, date_str):
        """Belirli bir gün için doktorun müsait saatlerini döndür"""
        # Hafta sonu kontrolü
        day = datetime.strptime(date_str, '%Y-%m-%d').weekday()  # 0=Mon, 6=Sun
        if day >= 5:  # cumartesi veya pazar
            return []

        table = dynamodb_client.dynamodb.Table(Config.APPOINTMENTS_TABLE)
        response = table.query(
            IndexName='DoctorEmailIndex',
            KeyConditionExpression=Key('doctor_email').eq(doctor_email),
            FilterExpression='#d = :date AND #s <> :cancelled',
            ExpressionAttributeNames={'#d': 'date', '#s': 'status'},
            ExpressionAttributeValues={':date': date_str, ':cancelled': 'cancelled'},
        )
        booked = {item['time_slot'] for item in response.get('Items', [])}
        return [slot for slot in WORK_SLOTS if slot not in booked]

    @staticmethod
    def create_appointment(patient_email, patient_name, doctor_email, doctor_name,
                           organization_id, date_str, time_slot,
                           feedback_id=None, patient_note=None):
        """Yeni randevu oluştur"""
        # Çakışma kontrolü
        available = AppointmentService.get_available_slots(doctor_email, date_str)
        if time_slot not in available:
            raise ValueError('Bu saat dilimi dolu veya müsait değil')

        appointment = {
            'id': str(uuid.uuid4()),
            'patient_email': patient_email,
            'patient_name': patient_name,
            'doctor_email': doctor_email,
            'doctor_name': doctor_name,
            'organization_id': organization_id or '',
            'date': date_str,
            'time_slot': time_slot,
            'status': 'pending',
            'feedback_id': feedback_id or '',
            'patient_note': patient_note or '',
            'created_at': datetime.now().isoformat(),
        }
        table = dynamodb_client.dynamodb.Table(Config.APPOINTMENTS_TABLE)
        table.put_item(Item=appointment)
        return appointment

    @staticmethod
    def get_patient_appointments(patient_email):
        """Hastanın randevularını getir"""
        table = dynamodb_client.dynamodb.Table(Config.APPOINTMENTS_TABLE)
        response = table.query(
            IndexName='PatientEmailIndex',
            KeyConditionExpression=Key('patient_email').eq(patient_email),
        )
        items = response.get('Items', [])
        items.sort(key=lambda x: (x.get('date', ''), x.get('time_slot', '')))
        return items

    @staticmethod
    def get_doctor_appointments(doctor_email):
        """Doktorun randevularını getir"""
        table = dynamodb_client.dynamodb.Table(Config.APPOINTMENTS_TABLE)
        response = table.query(
            IndexName='DoctorEmailIndex',
            KeyConditionExpression=Key('doctor_email').eq(doctor_email),
        )
        items = response.get('Items', [])
        items.sort(key=lambda x: (x.get('date', ''), x.get('time_slot', '')))
        return items

    @staticmethod
    def update_status(appointment_id, status, doctor_note=None):
        """Randevu durumunu güncelle (confirmed / cancelled)"""
        table = dynamodb_client.dynamodb.Table(Config.APPOINTMENTS_TABLE)
        update_expr = 'SET #s = :status'
        expr_names = {'#s': 'status'}
        expr_values = {':status': status}
        if doctor_note is not None:
            update_expr += ', doctor_note = :note'
            expr_values[':note'] = doctor_note
        table.update_item(
            Key={'id': appointment_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
        )
