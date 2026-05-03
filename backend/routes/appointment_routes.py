"""
Randevu API rotaları
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from services.appointment_service import AppointmentService

appointment_bp = Blueprint('appointment', __name__)


@appointment_bp.route('/appointments/slots', methods=['GET'])
@token_required
def get_slots(current_user):
    """Doktorun belirli günkü müsait saatlerini getir"""
    doctor_email = request.args.get('doctor_email')
    date_str = request.args.get('date')

    if not doctor_email or not date_str:
        return jsonify({'error': 'doctor_email ve date parametreleri gereklidir'}), 400

    try:
        slots = AppointmentService.get_available_slots(doctor_email, date_str)
        return jsonify({'slots': slots}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointment_bp.route('/appointments', methods=['POST'])
@token_required
def create_appointment(current_user):
    """Yeni randevu oluştur (hasta)"""
    data = request.get_json()

    doctor_email = data.get('doctor_email')
    doctor_name = data.get('doctor_name', '')
    organization_id = data.get('organization_id', '')
    date_str = data.get('date')
    time_slot = data.get('time_slot')
    feedback_id = data.get('feedback_id', '')
    patient_note = data.get('patient_note', '')

    if not doctor_email or not date_str or not time_slot:
        return jsonify({'error': 'doctor_email, date ve time_slot gereklidir'}), 400

    try:
        appointment = AppointmentService.create_appointment(
            patient_email=current_user['email'],
            patient_name=current_user.get('name', ''),
            doctor_email=doctor_email,
            doctor_name=doctor_name,
            organization_id=organization_id,
            date_str=date_str,
            time_slot=time_slot,
            feedback_id=feedback_id,
            patient_note=patient_note,
        )
        return jsonify({'appointment': appointment}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointment_bp.route('/appointments/mine', methods=['GET'])
@token_required
def get_my_appointments(current_user):
    """Hastanın kendi randevularını getir"""
    appointments = AppointmentService.get_patient_appointments(current_user['email'])
    return jsonify({'appointments': appointments}), 200


@appointment_bp.route('/appointments/doctor', methods=['GET'])
@token_required
def get_doctor_appointments(current_user):
    """Doktorun randevularını getir"""
    if current_user.get('role') not in ('doctor', 'admin'):
        return jsonify({'error': 'Yetkiniz yok'}), 403

    appointments = AppointmentService.get_doctor_appointments(current_user['email'])
    return jsonify({'appointments': appointments}), 200


@appointment_bp.route('/appointments/<appointment_id>', methods=['PUT'])
@token_required
def update_appointment(current_user, appointment_id):
    """Randevu durumunu güncelle (doktor)"""
    if current_user.get('role') not in ('doctor', 'admin'):
        return jsonify({'error': 'Yetkiniz yok'}), 403

    data = request.get_json()
    status = data.get('status')
    doctor_note = data.get('doctor_note')

    if status not in ('confirmed', 'cancelled'):
        return jsonify({'error': 'Geçersiz durum. confirmed veya cancelled olmalı'}), 400

    try:
        AppointmentService.update_status(appointment_id, status, doctor_note)
        return jsonify({'message': 'Randevu güncellendi'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
