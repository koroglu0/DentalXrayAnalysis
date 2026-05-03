"""
Kullanıcı yönetimi rotaları
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required, role_required
from services.user_service import UserService
from config.settings import Config

if Config.USE_COGNITO:
    from services.cognito_service import cognito_service

user_bp = Blueprint('user', __name__)

# ÖNEMLI: /users/stats route'u /users/<user_id>'den ÖNCE tanımlanmalı!
@user_bp.route('/users/stats', methods=['GET'])
@role_required('admin')
def get_user_stats(current_user):
    """Kullanıcı istatistiklerini getir"""
    try:
        users = UserService.get_all_users()
        
        stats = {
            'total': len(users),
            'active': len([u for u in users if u.get('status') == 'active']),
            'inactive': len([u for u in users if u.get('status') == 'inactive']),
            'by_role': {
                'admin': len([u for u in users if u.get('role') == 'admin']),
                'doctor': len([u for u in users if u.get('role') == 'doctor']),
                'patient': len([u for u in users if u.get('role') == 'patient'])
            }
        }
        
        return jsonify({'stats': stats}), 200
    except Exception as e:
        print(f"Get user stats error: {e}")
        return jsonify({'error': 'İstatistikler alınamadı'}), 500

@user_bp.route('/users', methods=['GET'])
@role_required('admin')
def get_all_users(current_user):
    """Tüm kullanıcıları listele (sadece admin)"""
    try:
        users = UserService.get_all_users()
        
        # Şifre bilgilerini çıkar
        safe_users = []
        for user in users:
            safe_user = {k: v for k, v in user.items() if k != 'password'}
            safe_users.append(safe_user)
        
        return jsonify({'users': safe_users}), 200
    except Exception as e:
        print(f"Get all users error: {e}")
        return jsonify({'error': 'Kullanıcılar alınamadı'}), 500

@user_bp.route('/users/<user_id>', methods=['GET'])
@role_required('admin')
def get_user_by_id(current_user, user_id):
    """Kullanıcı detaylarını getir"""
    try:
        user = UserService.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        # Şifre bilgisini çıkar
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({'user': safe_user}), 200
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Kullanıcı alınamadı'}), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    """Kullanıcı bilgilerini güncelle"""
    try:
        requester_email = current_user.get('email')
        requester_role = current_user.get('role')

        # Kullanıcı sadece kendi profilini güncelleyebilir; admin herkesi güncelleyebilir
        if requester_role != 'admin' and requester_email != user_id:
            return jsonify({'error': 'Yetkiniz yok'}), 403

        data = request.get_json()

        # Admin olmayan kullanıcılar sadece name ve phone'u değiştirebilir
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'phone' in data:
            update_data['phone'] = data['phone']

        # Yalnızca admin'e özel alanlar
        if requester_role == 'admin':
            if 'role' in data:
                update_data['role'] = data['role']
            if 'organization_id' in data:
                update_data['organization_id'] = data['organization_id']
            if 'specialization' in data:
                update_data['specialization'] = data['specialization']
            if 'status' in data:
                update_data['status'] = data['status']
        
        user = UserService.update_user(user_id, **update_data)
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        # Şifre bilgisini çıkar
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify({
            'message': 'Kullanıcı güncellendi',
            'user': safe_user
        }), 200
        
    except Exception as e:
        print(f"Update user error: {e}")
        return jsonify({'error': 'Kullanıcı güncellenemedi'}), 500

@user_bp.route('/users/<user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(current_user, user_id):
    """Kullanıcıyı sil"""
    try:
        # Kendi kendini silemesin
        if current_user.get('id') == user_id or current_user.get('email') == user_id:
            return jsonify({'error': 'Kendi hesabınızı silemezsiniz'}), 400
        
        # ÖNCE kullanıcı bilgisini al (DynamoDB'den silmeden önce!)
        user = UserService.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        user_email = user.get('email')
        
        # Cognito'dan sil (önce!)
        if Config.USE_COGNITO and user_email:
            try:
                print(f"🗑️  Cognito'dan siliniyor: {user_email}")
                cognito_service.admin_delete_user(user_email)
                print(f"✅ Cognito'dan silindi: {user_email}")
            except Exception as e:
                print(f"⚠️  Cognito delete error (devam ediliyor): {e}")
                # Cognito hatası olsa bile DynamoDB'den silmeye devam et
        
        # Sonra DynamoDB'den sil
        success = UserService.delete_user(user_id)
        
        if not success:
            return jsonify({'error': 'DynamoDB\'den silinemedi'}), 500
        
        print(f"✅ Kullanıcı tamamen silindi: {user_email}")
        return jsonify({'message': 'Kullanıcı Cognito ve DynamoDB\'den silindi'}), 200
        
    except Exception as e:
        print(f"❌ Delete user error: {e}")
        return jsonify({'error': 'Kullanıcı silinemedi'}), 500

@user_bp.route('/users/<user_id>/toggle-status', methods=['POST'])
@role_required('admin')
def toggle_user_status(current_user, user_id):
    """Kullanıcı durumunu aktif/pasif yap"""
    try:
        user = UserService.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        new_status = 'inactive' if user.get('status') == 'active' else 'active'
        updated_user = UserService.update_user(user_id, status=new_status)
        
        # Cognito'da da disable/enable yap
        if Config.USE_COGNITO and user.get('email'):
            try:
                if new_status == 'inactive':
                    cognito_service.admin_disable_user(user['email'])
                else:
                    cognito_service.admin_enable_user(user['email'])
            except Exception as e:
                print(f"Cognito status toggle error: {e}")
        
        safe_user = {k: v for k, v in updated_user.items() if k != 'password'}
        
        return jsonify({
            'message': f'Kullanıcı {new_status} durumuna getirildi',
            'user': safe_user
        }), 200
        
    except Exception as e:
        print(f"Toggle user status error: {e}")
        return jsonify({'error': 'Durum değiştirilemedi'}), 500
