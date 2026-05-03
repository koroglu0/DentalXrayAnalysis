"""
Analiz rotaları
"""
import os
import tempfile
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from middleware.auth import token_required, role_required
from services.ai_service import ai_service
from services.analysis_service import AnalysisService
from services.s3_service import s3_service
from config.settings import Config

analysis_bp = Blueprint('analysis', __name__)

def allowed_file(filename):
    """İzin verilen dosya tiplerini kontrol et"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@analysis_bp.route('/analyze', methods=['POST'])
@role_required('doctor', 'admin')
def analyze(current_user):
    """Diş röntgeni analiz et - Sadece doktor ve admin"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya bulunamadı'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Geçersiz dosya formatı. PNG, JPG veya JPEG kullanın.'}), 400
        
        # Analysis ID varsa (pending analiz güncellemesi)
        analysis_id = request.form.get('analysis_id')

        user_email = current_user['email']
        original_filename = secure_filename(file.filename)

        # Geçici dosyaya kaydet, analiz yap, S3'e yükle, geçici dosyayı sil
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(original_filename)[1], delete=False) as tmp:
            tmp_path = tmp.name
            file.save(tmp_path)

        try:
            # AI ile analiz yap
            findings, dimensions = ai_service.process_image(tmp_path)

            if findings is None:
                return jsonify({'error': 'Görüntü analiz edilemedi'}), 500

            # S3'e yükle
            s3_key = s3_service.upload_xray(tmp_path, user_email, original_filename)
        finally:
            os.unlink(tmp_path)

        # Sonuçları yapılandır
        results = {
            'findings': findings,
            'total_findings': len(findings),
            'image_dimensions': dimensions
        }

        # Eğer analysis_id varsa, mevcut pending analizi güncelle
        if analysis_id:
            print(f"🔄 Updating pending analysis: {analysis_id}")
            analysis_data = AnalysisService.update_analysis_with_results(
                analysis_id=analysis_id,
                doctor_email=user_email,
                results=results,
                image_s3_key=s3_key
            )

            if not analysis_data:
                return jsonify({'error': 'Analiz güncellenemedi'}), 500
        else:
            # Yeni analiz oluştur
            analysis_data = AnalysisService.save_analysis(user_email, original_filename, results, image_s3_key=s3_key)

        # Pre-signed URL oluştur (1 saat geçerli)
        image_url = s3_service.generate_presigned_url(s3_key)

        return jsonify({
            'message': 'Analiz tamamlandı',
            'findings': findings,
            'total_findings': len(findings),
            'image_dimensions': dimensions,
            'filename': original_filename,
            'image_url': image_url,
            'timestamp': analysis_data['timestamp']
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Analiz hatası: {str(e)}'}), 500

@analysis_bp.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    """Kullanıcının analiz geçmişini getir"""
    try:
        user_email = current_user['email']
        user_role = current_user.get('role', 'patient')
        
        # Admin tüm analizleri görebilir
        if user_role == 'admin':
            analyses = AnalysisService.get_all_analyses()
        elif user_role == 'doctor':
            # Doktor: kendi yükledikleri + hasta gönderip analiz ettikleri
            analyses = AnalysisService.get_doctor_analyses(user_email)
        else:
            analyses = AnalysisService.get_user_analyses(user_email)

        # Her analiz için pre-signed URL ekle (eski lokal yolları temizle)
        for a in analyses:
            s3_key = a.get('image_s3_key', '')
            if s3_key and s3_key.startswith('xrays/'):
                a['image_url'] = s3_service.generate_presigned_url(s3_key)
            else:
                a['image_url'] = None  # Eski lokal /uploads/ yollarını geçersiz kıl

        return jsonify({'history': analyses}), 200
        
    except Exception as e:
        return jsonify({'error': 'Geçmiş yüklenemedi'}), 500

@analysis_bp.route('/analysis/<analysis_id>', methods=['GET'])
@token_required
def get_analysis(current_user, analysis_id):
    """Belirli bir analizi getir"""
    try:
        analysis = AnalysisService.get_analysis_by_id(analysis_id)
        
        if not analysis:
            return jsonify({'error': 'Analiz bulunamadı'}), 404
        
        # Admin ve doktorlar tüm analizleri, hastalar sadece kendi analizlerini görebilir
        user_email = current_user['email']
        user_role = current_user.get('role', 'patient')
        
        if user_role == 'patient' and analysis.get('user_email') != user_email:
            return jsonify({'error': 'Yetkiniz yok'}), 403

        # Pre-signed URL ekle (eski lokal yolları temizle)
        s3_key = analysis.get('image_s3_key', '')
        if s3_key and s3_key.startswith('xrays/'):
            analysis['image_url'] = s3_service.generate_presigned_url(s3_key)
        else:
            analysis['image_url'] = None

        return jsonify({'analysis': analysis}), 200
        
    except Exception as e:
        return jsonify({'error': 'Analiz alınamadı'}), 500

@analysis_bp.route('/analysis/<analysis_id>', methods=['DELETE'])
@token_required
def delete_analysis(current_user, analysis_id):
    """Analizi sil"""
    try:
        analysis = AnalysisService.get_analysis_by_id(analysis_id)
        
        if not analysis:
            return jsonify({'error': 'Analiz bulunamadı'}), 404
        
        # Kullanıcı kendi analizini veya admin tüm analizleri silebilir
        user_email = current_user['email']
        user_role = current_user.get('role', 'patient')
        
        if user_role != 'admin' and analysis.get('user_email') != user_email:
            return jsonify({'error': 'Yetkiniz yok'}), 403
        
        success = AnalysisService.delete_analysis(analysis_id)
        
        if success:
            return jsonify({'message': 'Analiz silindi'}), 200
        else:
            return jsonify({'error': 'Analiz silinemedi'}), 500
        
    except Exception as e:
        return jsonify({'error': 'Silme işlemi başarısız'}), 500

@analysis_bp.route('/analysis/image-url', methods=['GET'])
@token_required
def get_image_url(current_user):
    """S3 görüntüsü için geçici pre-signed URL üret (1 saat geçerli)"""
    s3_key = request.args.get('key', '')
    if not s3_key or not s3_key.startswith('xrays/'):
        return jsonify({'error': 'Geçersiz key'}), 400
    url = s3_service.generate_presigned_url(s3_key)
    if not url:
        return jsonify({'error': 'URL oluşturulamadı'}), 500
    return jsonify({'url': url}), 200

@analysis_bp.route('/patient/send-xray', methods=['POST'])
@role_required('patient')
def send_xray_to_doctor(current_user):
    """Hasta röntgeni doktora gönderir - AI analizi yapmaz, sadak kaydeder"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya bulunamadı'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Geçersiz dosya formatı'}), 400
        
        organization_id = request.form.get('organization_id')
        doctor_email = request.form.get('doctor_email')
        patient_note = request.form.get('patient_note', '')
        
        if not organization_id or not doctor_email:
            return jsonify({'error': 'Organizasyon ve doktor seçimi gerekli'}), 400
        
        original_filename = secure_filename(file.filename)
        user_email = current_user['email']

        # Geçici dosyaya kaydet, S3'e yükle, geçici dosyayı sil
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(original_filename)[1], delete=False) as tmp:
            tmp_path = tmp.name
            file.save(tmp_path)

        try:
            s3_key = s3_service.upload_xray(tmp_path, user_email, original_filename)
        finally:
            os.unlink(tmp_path)

        image_url = s3_key
        
        # Analizi 'pending' durumunda kaydet (AI analizi yapılmamış)
        analysis_data = AnalysisService.save_pending_analysis(
            user_email=user_email,
            filename=original_filename,
            organization_id=organization_id,
            doctor_email=doctor_email,
            patient_note=patient_note,
            image_url=image_url
        )
        
        return jsonify({
            'message': 'Röntgen doktora gönderildi',
            'analysis_id': analysis_data.get('id'),
            'status': 'pending'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Gönderim hatası: {str(e)}'}), 500

@analysis_bp.route('/doctor/pending-xrays', methods=['GET'])
@role_required('doctor', 'admin')
def get_pending_xrays(current_user):
    """Doktora gönderilen bekleyen röntgenleri getir"""
    try:
        doctor_email = current_user['email']
        user_role = current_user.get('role')
        
        # Admin tüm pending analizleri görebilir
        if user_role == 'admin':
            analyses = AnalysisService.get_all_analyses()
            # Sadece pending olanları filtrele
            pending_analyses = [a for a in analyses if a.get('status') == 'pending']
        else:
            # Doktor sadece kendisine gönderilenleri görür
            pending_analyses = AnalysisService.get_pending_analyses_for_doctor(doctor_email)

        # Her pending analiz için pre-signed URL ekle (eski lokal yolları temizle)
        for a in pending_analyses:
            s3_key = a.get('image_s3_key', '')
            if s3_key and s3_key.startswith('xrays/'):
                a['image_url'] = s3_service.generate_presigned_url(s3_key)
            else:
                a['image_url'] = None

        return jsonify({
            'pending_xrays': pending_analyses,
            'count': len(pending_analyses)
        }), 200
        
    except Exception as e:
        print(f"Get pending xrays error: {e}")
        return jsonify({'error': 'Bekleyen röntgenler alınamadı'}), 500


@analysis_bp.route('/generate-report', methods=['POST'])
@token_required
def generate_ai_report(current_user):
    """AI ile detaylı dental rapor oluştur"""
    try:
        from services.gemini_service import gemini_service
        
        data = request.get_json()
        findings = data.get('findings', [])
        patient_info = data.get('patient_info')
        
        if not findings:
            return jsonify({'error': 'Bulgu verisi gerekli'}), 400
        
        # Gemini ile rapor oluştur
        report = gemini_service.generate_dental_report(findings, patient_info)
        
        return jsonify({
            'success': True,
            'report': report
        }), 200
        
    except Exception as e:
        print(f"Generate report error: {e}")
        return jsonify({'error': f'Rapor oluşturma hatası: {str(e)}'}), 500
