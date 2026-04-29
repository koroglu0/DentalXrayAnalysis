"""
Kimlik doğrulama ve kullanıcı yönetimi rotaları - Cognito ve JWT desteği
"""
from flask import Blueprint, request, jsonify
from services.user_service import UserService
from middleware.auth import token_required, role_required
from config.settings import Config

# Cognito kullanılıyorsa import et
if Config.USE_COGNITO:
    from services.cognito_service import cognito_service

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Yeni kullanıcı kaydı"""
    try:
        from services.organization_service import OrganizationService
        
        data = request.get_json()
        print(f"📥 Register request data: {data}")
        
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        role = data.get('role', 'patient')
        invite_code = data.get('invite_code')  # Davet kodu
        
        if not email or not password or not name:
            return jsonify({'error': 'E-posta, şifre ve isim gereklidir'}), 400
        
        # Davet kodu varsa doğrula
        organization_id = None
        if invite_code:
            organization = OrganizationService.validate_invite_code(invite_code)
            if not organization:
                return jsonify({'error': 'Geçersiz davet kodu'}), 400
            organization_id = organization['id']
        
        # Ek bilgiler
        kwargs = {
            'organization_id': organization_id or data.get('organization_id'),
            'specialization': data.get('specialization'),
            'phone': data.get('phone', '')
            # role kwargs'a eklenmemeli, doğrudan parametre olarak gönderiliyor
        }
        
        if Config.USE_COGNITO:
            print(f"🔐 Cognito ile kayıt başlatılıyor: {email}")
            # Cognito ile kayıt - role'ü de kwargs'a ekle
            cognito_kwargs = {**kwargs, 'role': role}
            cognito_user = cognito_service.sign_up(email, password, name, **cognito_kwargs)
            print(f"✅ Cognito kullanıcı oluşturuldu: {cognito_user}")
            
            # Kullanıcıyı DynamoDB'ye de kaydet (kullanıcı profili için)
            try:
                user_data = UserService.create_user(
                    email=email,
                    password=None,  # Cognito kullanıyoruz, şifre hash'e gerek yok
                    name=name,
                    role=role,
                    cognito_sub=cognito_user['user_sub'],
                    **kwargs
                )
            except ValueError as db_err:
                if 'zaten kayıtlı' in str(db_err):
                    # DynamoDB'de zaten var (önceki kayıt), Cognito kaydı geçerli
                    print(f"⚠️  DynamoDB duplicate, Cognito kaydı kullanılıyor: {email}")
                    user_data = UserService.get_user(email) or {'email': email, 'name': name, 'role': role}
                else:
                    raise db_err
            
            # Davet kodu ile kayıt olduysa organizasyona üye ekle
            if organization_id:
                try:
                    OrganizationService.add_member(organization_id, email, name, role)
                except ValueError:
                    pass  # Zaten üye
            
            return jsonify({
                'message': 'Kayıt başarılı. E-posta adresinizi doğrulayın.',
                'user': user_data,
                'requires_verification': not cognito_user['user_confirmed']
            }), 201
        else:
            # Yerleşik JWT ile kayıt
            user_data = UserService.create_user(email, password, name, role, **kwargs)
            
            # Davet kodu ile kayıt olduysa organizasyona üye ekle
            if organization_id:
                try:
                    OrganizationService.add_member(organization_id, email, name, role)
                except ValueError:
                    pass  # Zaten üye
            
            token = UserService.generate_token(user_data)
            user_data.pop('password_hash', None)
            
            return jsonify({
                'message': 'Kayıt başarılı',
                'token': token,
                'user': user_data
            }), 201
        
    except ValueError as e:
        print(f"❌ ValueError: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"❌ Register error: {e}")
        import traceback
        traceback.print_exc()
        print(f"Register error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Kayıt sırasında bir hata oluştu: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Kullanıcı girişi"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'E-posta ve şifre gereklidir'}), 400
        
        if Config.USE_COGNITO:
            # Cognito ile giriş
            auth_result = cognito_service.sign_in(email, password)
            
            # Kullanıcı bilgilerini al
            user_data = cognito_service.get_user(auth_result['access_token'])
            
            # DynamoDB'den ek bilgileri al
            db_user = UserService.get_user(email)
            if db_user:
                user_data.update(db_user)
            
            # Şifre hash'ini çıkar
            user_data.pop('password_hash', None)
            
            return jsonify({
                'message': 'Giriş başarılı',
                'access_token': auth_result['access_token'],
                'id_token': auth_result['id_token'],
                'refresh_token': auth_result['refresh_token'],
                'expires_in': auth_result['expires_in'],
                'token': auth_result['access_token'],  # Backward compatibility
                'user': user_data
            }), 200
        else:
            # Yerleşik JWT ile giriş
            user_data = UserService.authenticate_user(email, password)
            
            if not user_data:
                return jsonify({'error': 'Geçersiz e-posta veya şifre'}), 401
            
            token = UserService.generate_token(user_data)
            user_data.pop('password_hash', None)
            
            return jsonify({
                'message': 'Giriş başarılı',
                'token': token,
                'user': user_data
            }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Giriş sırasında bir hata oluştu: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Mevcut kullanıcı bilgilerini getir"""
    try:
        email = current_user.get('email') or current_user.get('username')
        user_data = UserService.get_user(email)
        
        if not user_data:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 404
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'error': 'Kullanıcı bilgileri alınamadı'}), 500

# Cognito-specific endpoints
if Config.USE_COGNITO:
    
    @auth_bp.route('/confirm-email', methods=['POST'])
    def confirm_email():
        """Email doğrulama kodu ile hesabı aktifleştir"""
        try:
            data = request.get_json()
            email = data.get('email')
            code = data.get('code')
            
            if not email or not code:
                return jsonify({'error': 'Email ve doğrulama kodu gereklidir'}), 400
            
            cognito_service.confirm_sign_up(email, code)
            
            return jsonify({'message': 'Email başarıyla doğrulandı'}), 200
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            print(f"Email confirmation error: {e}")
            return jsonify({'error': 'Email doğrulama hatası'}), 500
    
    @auth_bp.route('/forgot-password', methods=['POST'])
    def forgot_password():
        """Şifre sıfırlama kodu gönder"""
        try:
            data = request.get_json()
            email = data.get('email')
            
            if not email:
                return jsonify({'error': 'Email gereklidir'}), 400
            
            cognito_service.forgot_password(email)
            
            return jsonify({'message': 'Şifre sıfırlama kodu email adresinize gönderildi'}), 200
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            print(f"Forgot password error: {e}")
            return jsonify({'error': 'Şifre sıfırlama hatası'}), 500
    
    @auth_bp.route('/reset-password', methods=['POST'])
    def reset_password():
        """Şifre sıfırlama kodunu onayla ve yeni şifre belirle"""
        try:
            data = request.get_json()
            email = data.get('email')
            code = data.get('code')
            new_password = data.get('new_password')
            
            if not email or not code or not new_password:
                return jsonify({'error': 'Email, kod ve yeni şifre gereklidir'}), 400
            
            cognito_service.confirm_forgot_password(email, code, new_password)
            
            return jsonify({'message': 'Şifreniz başarıyla değiştirildi'}), 200
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            print(f"Reset password error: {e}")
            return jsonify({'error': 'Şifre sıfırlama hatası'}), 500
    
    @auth_bp.route('/refresh-token', methods=['POST'])
    def refresh_access_token():
        """Refresh token ile yeni access token al"""
        try:
            data = request.get_json()
            refresh_token = data.get('refresh_token')
            
            if not refresh_token:
                return jsonify({'error': 'Refresh token gereklidir'}), 400
            
            result = cognito_service.refresh_token(refresh_token)
            
            return jsonify({
                'access_token': result['access_token'],
                'id_token': result['id_token'],
                'expires_in': result['expires_in']
            }), 200
            
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            print(f"Token refresh error: {e}")
            return jsonify({'error': 'Token yenileme hatası'}), 500


# Google OAuth Endpoint
@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """Google ile giriş yap"""
    try:
        from services.google_auth_service import google_auth_service
        
        data = request.get_json()
        credential = data.get('credential')  # Google ID token
        
        if not credential:
            return jsonify({'error': 'Google credential gereklidir'}), 400
        
        print(f"🔐 Google login attempt with credential")
        
        # Google token'ını doğrula
        google_user = google_auth_service.verify_google_token(credential)
        print(f"✅ Google user verified: {google_user['email']}")
        
        email = google_user['email']
        name = google_user['name'] or google_user['given_name'] or email.split('@')[0]
        
        # Kullanıcı veritabanında var mı kontrol et
        existing_user = UserService.get_user(email)
        
        if existing_user:
            # Kullanıcı varsa, bilgilerini güncelle ve token oluştur
            print(f"📋 Existing user found: {email}")
            user_data = existing_user
            
            # Google profil resmini güncelle (opsiyonel)
            if google_user.get('picture'):
                try:
                    UserService.update_user(email, {'profile_picture': google_user['picture']})
                except:
                    pass  # Güncelleme başarısız olursa devam et
        else:
            # Yeni kullanıcı oluştur
            print(f"📝 Creating new user: {email}")
            user_data = UserService.create_user(
                email=email,
                password=None,  # Google ile giriş, şifre yok
                name=name,
                role='patient',  # Varsayılan rol
                google_id=google_user['google_id'],
                profile_picture=google_user.get('picture', '')
            )
        
        # JWT token oluştur
        token = UserService.generate_token(user_data)
        
        # Hassas bilgileri kaldır
        user_data.pop('password_hash', None)
        
        return jsonify({
            'message': 'Google ile giriş başarılı',
            'token': token,
            'access_token': token,
            'user': user_data
        }), 200
        
    except ValueError as e:
        print(f"❌ Google login ValueError: {str(e)}")
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        print(f"❌ Google login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Google ile giriş sırasında bir hata oluştu: {str(e)}'}), 500


# Cognito OAuth Callback Endpoint
@auth_bp.route('/cognito-callback', methods=['POST'])
def cognito_callback():
    """Cognito OAuth callback - authorization code'u token'a dönüştür"""
    try:
        import requests
        
        data = request.get_json()
        code = data.get('code')
        redirect_uri = data.get('redirect_uri')
        
        if not code:
            return jsonify({'error': 'Authorization code gereklidir'}), 400
        
        print(f"🔐 Cognito callback with authorization code")
        
        # Cognito token endpoint'ine istek at
        cognito_domain = f"dental-ai-app.auth.{Config.COGNITO_REGION}.amazoncognito.com"
        token_url = f"https://{cognito_domain}/oauth2/token"
        
        # Token exchange parametreleri
        token_data = {
            'grant_type': 'authorization_code',
            'client_id': Config.COGNITO_APP_CLIENT_ID,
            'code': code,
            'redirect_uri': redirect_uri or 'http://localhost:5173/auth/callback'
        }
        
        # Client secret varsa ekle
        if Config.COGNITO_APP_CLIENT_SECRET:
            token_data['client_secret'] = Config.COGNITO_APP_CLIENT_SECRET
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        print(f"📤 Requesting tokens from: {token_url}")
        
        response = requests.post(token_url, data=token_data, headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Token exchange failed: {response.text}")
            return jsonify({'error': 'Token exchange başarısız'}), 400
        
        tokens = response.json()
        access_token = tokens.get('access_token')
        id_token = tokens.get('id_token')
        refresh_token = tokens.get('refresh_token')
        
        print(f"✅ Tokens received successfully")
        
        # Kullanıcı bilgilerini al
        if Config.USE_COGNITO:
            user_data = cognito_service.get_user(access_token)
        else:
            # ID token'dan bilgileri çıkar
            import jwt
            user_data = jwt.decode(id_token, options={"verify_signature": False})
        
        email = user_data.get('email') or user_data.get('username')
        name = user_data.get('name', email.split('@')[0] if email else 'User')
        
        print(f"👤 User info: {email}, {name}")
        
        # Kullanıcıyı DynamoDB'de kontrol et veya oluştur
        existing_user = UserService.get_user(email)
        
        if existing_user:
            print(f"📋 Existing user found: {email}")
            db_user = existing_user
        else:
            # Yeni kullanıcı oluştur
            print(f"📝 Creating new user: {email}")
            db_user = UserService.create_user(
                email=email,
                password=None,
                name=name,
                role='patient',
                cognito_sub=user_data.get('sub'),
                profile_picture=user_data.get('picture', '')
            )
        
        # Hassas bilgileri kaldır
        db_user.pop('password_hash', None)
        
        return jsonify({
            'message': 'Giriş başarılı',
            'access_token': access_token,
            'id_token': id_token,
            'refresh_token': refresh_token,
            'user': db_user
        }), 200
        
    except Exception as e:
        print(f"❌ Cognito callback error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Giriş sırasında bir hata oluştu: {str(e)}'}), 500
