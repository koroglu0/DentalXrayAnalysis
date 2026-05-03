"""
Geri bildirim API rotaları
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from services.feedback_service import FeedbackService
from services.user_service import UserService

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/feedbacks', methods=['POST'])
@token_required
def create_feedback(current_user):
    """Doktor hastaya geri bildirim gönderir"""
    if current_user.get('role') not in ('doctor', 'admin'):
        return jsonify({'error': 'Yalnızca doktorlar geri bildirim gönderebilir'}), 403

    data = request.get_json()
    analysis_id = data.get('analysis_id', '')
    patient_email = data.get('patient_email')
    message = data.get('message', '').strip()

    if not patient_email or not message:
        return jsonify({'error': 'Hasta e-postası ve mesaj gereklidir'}), 400

    feedback = FeedbackService.create_feedback(
        analysis_id=analysis_id,
        doctor_email=current_user['email'],
        doctor_name=current_user.get('name', ''),
        patient_email=patient_email,
        message=message,
    )
    return jsonify({'feedback': feedback}), 201


@feedback_bp.route('/feedbacks/mine', methods=['GET'])
@token_required
def get_my_feedbacks(current_user):
    """Hastanın kendi geri bildirimlerini getirir"""
    feedbacks = FeedbackService.get_patient_feedbacks(current_user['email'])
    unread = sum(1 for f in feedbacks if not f.get('is_read'))
    return jsonify({'feedbacks': feedbacks, 'unread_count': unread}), 200


@feedback_bp.route('/feedbacks/unread-count', methods=['GET'])
@token_required
def unread_count(current_user):
    """Okunmamış geri bildirim sayısı"""
    count = FeedbackService.get_unread_count(current_user['email'])
    return jsonify({'unread_count': count}), 200


@feedback_bp.route('/feedbacks/<feedback_id>/read', methods=['PUT'])
@token_required
def mark_read(current_user, feedback_id):
    """Geri bildirimi okundu olarak işaretle"""
    FeedbackService.mark_as_read(feedback_id)
    return jsonify({'message': 'Okundu olarak işaretlendi'}), 200
