"""
Authentication middleware - Cognito ve JWT desteği
"""
from functools import wraps
from flask import request, jsonify
import jwt
from config.settings import Config

# Cognito kullanılıyorsa verifier'ı import et
if Config.USE_COGNITO:
    from utils.cognito_verifier import cognito_verifier

def token_required(f):
    """Token gerektiren endpoint'ler için decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            print("❌ Token bulunamadı!")
            return jsonify({'error': 'Token gereklidir'}), 401
        
        print(f"🔑 Token alındı: {token[:20]}...")
        
        try:
            if Config.USE_COGNITO:
                print("🔐 Cognito token doğrulanıyor...")
                
                # Önce custom JWT mi diye kontrol et (Google kullanıcısının şifre ile girişi)
                custom_user = None
                try:
                    custom_data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                    custom_user = custom_data
                    print(f"✅ Custom JWT doğrulandı: {custom_data.get('email')}")
                except Exception:
                    custom_user = None
                
                if custom_user:
                    current_user = custom_user
                else:
                    # Cognito token doğrulama
                    claims = cognito_verifier.verify_token(token, token_use='access')
                
                    # Email'i claims'den veya username'den al
                    email = claims.get('email')
                    username = claims.get('username') or claims.get('cognito:username')
                    cognito_sub = claims.get('sub')
                    
                    # Email yoksa username kullan (bazı durumlarda email username ile aynı olabilir)
                    if not email and '@' in (username or ''):
                        email = username
                    
                    print(f"✅ Cognito claims alındı - sub: {cognito_sub}, email: {email}, username: {username}")
                    
                    # DynamoDB'den tam kullanıcı bilgilerini al
                    from services.user_service import UserService
                    user_data = None
                    
                    # Önce cognito_sub ile ara (en güvenilir yöntem)
                    if cognito_sub:
                        user_data = UserService.get_user_by_cognito_sub(cognito_sub)
                        if user_data:
                            print(f"✅ Kullanıcı cognito_sub ile bulundu: {user_data.get('email')}, role: {user_data.get('role')}")
                    
                    # Cognito_sub ile bulunamadıysa email ile dene
                    if not user_data and email:
                        user_data = UserService.get_user(email)
                        if user_data:
                            print(f"✅ Kullanıcı email ile bulundu: {email}, role: {user_data.get('role')}")
                    
                    # Email ile de bulunamadıysa username ile dene
                    if not user_data and username:
                        user_data = UserService.get_user(username)
                        if user_data:
                            print(f"✅ Kullanıcı username ile bulundu: {username}, role: {user_data.get('role')}")
                    
                    if user_data:
                        current_user = user_data
                        current_user['sub'] = cognito_sub
                    else:
                        # google_cognito_sub ile ara (Google federated login sonrası)
                        from services.user_service import UserService as US2
                        user_data = US2.get_user_by_google_sub(cognito_sub)
                        if user_data:
                            print(f"✅ Kullanıcı google_cognito_sub ile bulundu: {user_data.get('email')}")
                            current_user = user_data
                            current_user['sub'] = cognito_sub
                        else:
                            # Fallback: sadece Cognito claims
                            current_user = {
                                'sub': cognito_sub,
                                'email': email or username,
                                'username': username,
                                'role': 'patient'
                            }
                            print(f"⚠️  DynamoDB'de kullanıcı bulunamadı (sub: {cognito_sub}, email: {email}, username: {username}), fallback kullanılıyor")
            else:
                print("🔓 JWT token doğrulanıyor...")
                # Yerleşik JWT doğrulama
                data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                current_user = data
                print(f"✅ JWT doğrulandı: {data.get('email')}")
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token süresi dolmuş'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Geçersiz token'}), 401
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            print(f"Token verification error: {e}")
            return jsonify({'error': 'Token doğrulama hatası'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def optional_token(f):
    """Token opsiyonel olan endpoint'ler için decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                current_user = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            except:
                pass
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def role_required(*roles):
    """Belirli roller için yetkilendirme"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            auth_header = request.headers.get('Authorization')
            
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            
            if not token:
                return jsonify({'error': 'Token gereklidir'}), 401
            
            try:
                if Config.USE_COGNITO:
                    # Önce custom JWT mi diye kontrol et (Google kullanıcısının şifre ile girişi)
                    try:
                        custom_data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                        user_role = custom_data.get('role', 'patient')
                        if user_role not in roles:
                            return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
                        return f(custom_data, *args, **kwargs)
                    except Exception:
                        pass

                    # Cognito token doğrulama
                    claims = cognito_verifier.verify_token(token, token_use='access')
                    cognito_sub = claims.get('sub')
                    email = claims.get('email')
                    username = claims.get('username') or claims.get('cognito:username')
                    
                    # DynamoDB'den kullanıcı bilgilerini al
                    from services.user_service import UserService
                    user_data = None
                    
                    # Önce cognito_sub ile ara
                    if cognito_sub:
                        user_data = UserService.get_user_by_cognito_sub(cognito_sub)
                    
                    # google_cognito_sub ile ara (Google federated login)
                    if not user_data and cognito_sub:
                        user_data = UserService.get_user_by_google_sub(cognito_sub)
                    
                    # Bulunamadıysa email ile dene
                    if not user_data and email:
                        user_data = UserService.get_user(email)
                    
                    # Hala bulunamadıysa username ile dene
                    if not user_data and username:
                        user_data = UserService.get_user(username)
                    
                    if user_data:
                        user_role = user_data.get('role', 'patient')
                    else:
                        user_role = 'patient'
                else:
                    # Yerleşik JWT doğrulama
                    data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
                    user_role = data.get('role', 'patient')
                
                if user_role not in roles:
                    return jsonify({'error': 'Bu işlem için yetkiniz yok'}), 403
                
                # Cognito için user_data'yı, JWT için data'yı gönder
                current_user = user_data if Config.USE_COGNITO and user_data else data
                return f(current_user, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token süresi dolmuş'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Geçersiz token'}), 401
        
        return decorated
    return decorator
