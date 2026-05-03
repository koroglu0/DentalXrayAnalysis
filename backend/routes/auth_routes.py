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
            cognito_err_msg = None
            auth_result = None
            try:
                auth_result = cognito_service.sign_in(email, password)
            except Exception as cognito_err:
                cognito_err_msg = str(cognito_err)
                print(f"⚠️  Cognito giriş başarısız: {cognito_err_msg}")

            if auth_result is None:
                # Cognito başarısız → Google ile kayıtlı kullanıcı şifre belirlemiş olabilir
                # DynamoDB'den password_hash dahil ham veriyi direkt çek
                try:
                    from utils.dynamodb_client import dynamodb_client
                    from config.settings import Config as _Config
                    _table = dynamodb_client.dynamodb.Table(_Config.USERS_TABLE)
                    _resp = _table.get_item(Key={'email': email})
                    db_user_raw = _resp.get('Item') if _resp else None
                except Exception as _e:
                    print(f"❌ DynamoDB direkt okuma hatası: {_e}")
                    db_user_raw = None

                print(f"🔍 DynamoDB fallback (raw): db_user_raw bulundu={db_user_raw is not None}, has_password_hash={bool(db_user_raw.get('password_hash')) if db_user_raw else False}")
                if db_user_raw and db_user_raw.get('password_hash'):
                    from werkzeug.security import check_password_hash
                    hash_match = check_password_hash(db_user_raw['password_hash'], password)
                    print(f"🔍 check_password_hash sonucu: {hash_match}")
                    if hash_match:
                        db_user_raw.pop('password_hash', None)
                        token = UserService.generate_token(db_user_raw)
                        print(f"✅ DynamoDB password_hash ile giriş başarılı: {email}")
                        return jsonify({
                            'message': 'Giriş başarılı',
                            'access_token': token,
                            'token': token,
                            'user': db_user_raw
                        }), 200
                # Fallback da başarısız
                return jsonify({'error': cognito_err_msg or 'Geçersiz e-posta veya şifre'}), 401

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
                    UserService._update_user_fields(email, {'profile_picture': google_user['picture']})
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
            try:
                err_detail = response.json().get('error_description') or response.json().get('error') or response.text
            except Exception:
                err_detail = response.text
            return jsonify({'error': f'Token exchange başarısız: {err_detail}'}), 400
        
        tokens = response.json()
        access_token = tokens.get('access_token')
        id_token = tokens.get('id_token')
        refresh_token = tokens.get('refresh_token')
        
        print(f"✅ Tokens received successfully")
        
        # Kullanıcı bilgilerini al:
        # Önce Cognito /oauth2/userInfo endpoint'ini dene (sadece openid scope gerektirir)
        # id_token'dan fallback
        import jwt as pyjwt
        user_data = {}
        
        try:
            cognito_domain = f"dental-ai-app.auth.{Config.COGNITO_REGION}.amazoncognito.com"
            userinfo_response = requests.get(
                f"https://{cognito_domain}/oauth2/userInfo",
                headers={'Authorization': f'Bearer {access_token}'}
            )
            if userinfo_response.status_code == 200:
                user_data = userinfo_response.json()
                print(f"✅ userInfo endpoint'inden alındı: {user_data}")
            else:
                print(f"⚠️  userInfo failed ({userinfo_response.status_code}), id_token decode deneniyor")
                user_data = pyjwt.decode(id_token, options={"verify_signature": False})
        except Exception as userinfo_err:
            print(f"⚠️  userInfo hatası: {userinfo_err}, id_token decode deneniyor")
            try:
                user_data = pyjwt.decode(id_token, options={"verify_signature": False})
            except Exception as decode_err:
                print(f"❌ id_token decode hatası: {decode_err}")
                return jsonify({'error': 'Kullanıcı bilgisi alınamadı'}), 400
        
        email = user_data.get('email') or user_data.get('username')
        cognito_sub = user_data.get('sub')
        given = user_data.get('given_name', '')
        family = user_data.get('family_name', '')
        name = user_data.get('name') or f"{given} {family}".strip() or (email.split('@')[0] if email else 'User')
        print(f"👤 Kullanıcı: email={email}, sub={cognito_sub}, name={name}")
        
        if not email:
            return jsonify({'error': 'E-posta bilgisi alınamadı. Google hesabınızda e-posta doğrulaması gerekli.'}), 400
        
        # Google federated username (Google_XXXXXX) gerçek email değil
        # Cognito'da Google attribute mapping yapılmamışsa bu durum oluşur
        if '@' not in email:
            return jsonify({
                'error': 'Google ile giriş yapılamadı: E-posta adresi alınamadı. '
                         'Lütfen yöneticiyle iletişime geçin. '
                         '(Cognito Google attribute mapping eksik: email → email)'
            }), 400
        
        # Kullanıcıyı DynamoDB'de kontrol et veya oluştur
        existing_user = UserService.get_user(email)
        
        if existing_user:
            print(f"📋 Existing user found: {email}")
            db_user = existing_user
            # Profil tamamlanmamışsa is_new_user=True döndür → complete-profile ekranı açılır
            is_new_user = not existing_user.get('google_profile_completed', True)
            print(f"📋 google_profile_completed={existing_user.get('google_profile_completed')}, is_new_user={is_new_user}")

            # Google federated hesabını mevcut Cognito hesabına bağla (account linking)
            # Böylece Cognito'da tek kullanıcı kalır
            existing_cognito_sub = existing_user.get('cognito_sub')
            if existing_cognito_sub and existing_cognito_sub != cognito_sub:
                # Google provider'ını email/şifre hesabına link et
                google_user_id = None
                try:
                    identities = user_data.get('identities', '[]')
                    if isinstance(identities, str):
                        import json as _json
                        identities = _json.loads(identities)
                    google_entry = next((i for i in identities if i.get('providerName') == 'Google'), None)
                    if google_entry:
                        google_user_id = google_entry.get('userId')
                except Exception:
                    pass

                if google_user_id:
                    try:
                        import boto3
                        cognito_client = boto3.client(
                            'cognito-idp',
                            region_name=Config.COGNITO_REGION,
                            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY
                        )
                        cognito_client.admin_link_provider_for_user(
                            UserPoolId=Config.COGNITO_USER_POOL_ID,
                            DestinationUser={
                                'ProviderName': 'Cognito',
                                'ProviderAttributeValue': existing_cognito_sub
                            },
                            SourceUser={
                                'ProviderName': 'Google',
                                'ProviderAttributeName': 'Cognito_Subject',
                                'ProviderAttributeValue': google_user_id
                            }
                        )
                        print(f"✅ Google hesabı mevcut Cognito hesabına bağlandı: {email}")
                    except Exception as link_err:
                        # AlreadyLinked hatası normal, diğerleri logla
                        if 'already linked' not in str(link_err).lower():
                            print(f"⚠️  Account linking hatası (devam ediliyor): {link_err}")

            # Google sub'ı ayrı alanda sakla (fallback için), profile picture güncelle
            updates = {}
            if not existing_user.get('google_cognito_sub') or existing_user.get('google_cognito_sub') != cognito_sub:
                updates['google_cognito_sub'] = cognito_sub
            if not existing_user.get('profile_picture') and user_data.get('picture'):
                updates['profile_picture'] = user_data.get('picture', '')
            if updates:
                UserService._update_user_fields(email, updates)
                db_user.update(updates)
                print(f"✅ Kullanıcı güncellendi: {email}")
        else:
            # Yeni kullanıcı oluştur
            print(f"📝 Creating new user: {email}")
            db_user = UserService.create_user(
                email=email,
                password=None,
                name=name,
                role='patient',
                cognito_sub=cognito_sub,
                profile_picture=user_data.get('picture', '')
            )
            is_new_user = True
        
        # Hassas bilgileri kaldır
        db_user.pop('password_hash', None)
        
        return jsonify({
            'message': 'Giriş başarılı',
            'access_token': access_token,
            'id_token': id_token,
            'refresh_token': refresh_token,
            'is_new_user': is_new_user,
            'user': db_user
        }), 200
        
    except Exception as e:
        print(f"❌ Cognito callback error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Giriş sırasında bir hata oluştu: {str(e)}'}), 500


@auth_bp.route('/complete-google-profile', methods=['POST'])
@token_required
def complete_google_profile(current_user):
    """Google ile giriş yapan yeni kullanıcının profil tamamlama (rol + opsiyonel şifre)"""
    try:
        data = request.get_json()
        role = data.get('role')
        password = data.get('password')
        invite_code = data.get('invite_code')
        specialization = data.get('specialization')

        email = current_user.get('email')
        if not email:
            return jsonify({'error': 'Kullanıcı bulunamadı'}), 401

        if role not in ('patient', 'doctor', 'admin'):
            return jsonify({'error': 'Geçersiz hesap türü'}), 400

        # Admin için davet kodu zorunlu
        if role == 'admin':
            if not invite_code or invite_code != Config.ADMIN_INVITE_CODE:
                return jsonify({'error': 'Admin hesabı için geçersiz davet kodu'}), 403

        updates = {'role': role, 'google_profile_completed': True}

        if role == 'doctor' and specialization:
            updates['specialization'] = specialization

        # Opsiyonel şifre — DynamoDB'ye hash'li kaydet
        if password:
            from werkzeug.security import generate_password_hash
            updates['password_hash'] = generate_password_hash(password)
            print(f"🔑 Şifre hash'lendi, kaydediliyor: {email}")
        else:
            print(f"ℹ️  Şifre belirtilmedi (opsiyonel): {email}")

        print(f"🔄 update_fields çağrılıyor: email={email}, keys={list(updates.keys())}")
        result = UserService._update_user_fields(email, updates)
        print(f"🔄 update_fields sonucu: {result}")

        updated_user = UserService.get_user(email)
        if not updated_user:
            return jsonify({'error': 'Kullanıcı güncellenemedi'}), 500

        updated_user.pop('password_hash', None)
        print(f"✅ Google profil tamamlandı: {email}, rol: {role}")

        return jsonify({'message': 'Profil tamamlandı', 'user': updated_user}), 200

    except Exception as e:
        print(f"❌ complete-google-profile error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Profil güncellenemedi: {str(e)}'}), 500
