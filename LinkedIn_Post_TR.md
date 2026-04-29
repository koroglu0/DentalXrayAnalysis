# Bitirme Projem: Dental X-Ray AI — Diş Röntgenlerinde Yapay Zeka ile Klinik Akış

Son sınıf yazılım mühendisliği öğrencisi olarak bitirme projemi diş hekimliği odaklı bir yapay zeka çözümü üzerine geliştirdim. Dental X-Ray AI; diş röntgenlerini Ultralytics YOLO ile analiz eden, bulguları klinik açıdan anlamlı hale getiren ve rol bazlı erişimle gerçek bir muayene akışına uyarlayan uçtan uca bir sistemdir. Bu çalışma, klinik kararların yerini almak değil, hekimleri daha hızlı ve sistematik bir şekilde desteklemek amacıyla tasarlandı.

## Öne Çıkanlar
- **YOLO tabanlı bulgu tespiti**: Çürük, apse, dolgu, implant gibi bulguları güven skorlarıyla birlikte sınıflandırır.
- **Yapılandırılmış sonuçlar**: Her bulgu için açıklama, öneri ve normalize edilmiş bounding-box koordinatları üretir.
- **Rol bazlı akış**: `admin`, `doctor`, `patient` rollerine göre yetkilendirme; hasta röntgenini doktora iletir, doktor analiz başlatır, bekleyen röntgenler listelenir.
- **Güvenli kimlik doğrulama**: AWS Cognito ve Google OAuth doğrulaması; JWT ile korunan endpoint’ler.
- **Veri katmanı (AWS DynamoDB)**: Kullanıcılar, analizler, hastalar, organizasyonlar ve notlar için ölçeklenebilir tablo ve indeksler.
- **LLM destekli rapor**: `Gemini` entegrasyonu ile bulgulardan detaylı dental rapor üretimi.
- **Modern arayüz**: React + Vite + Tailwind CSS ile hızlı, responsif ve kullanıcı dostu web deneyimi.

## Mimari ve Akış
- **Backend (Flask, mikroservis prensipleri)**: Katmanlı yapı — `routes` (HTTP), `services` (iş mantığı), `middleware` (auth), `utils` (yardımcılar). `AIService` YOLO modelini yükleyip görüntüleri işler; `AnalysisService` analiz geçmişini ve kayıtları yönetir.
- **Önemli endpoint’ler**: `POST /api/analyze` (doktor/admin), `GET /api/history` (rol tabanlı), `POST /api/patient/send-xray` (hasta→doktor akışı), `POST /api/generate-report` (LLM raporu), `GET /api/health` (durum).
- **Frontend (React)**: Admin ve doktor panoları, hasta yönetimi, yükleme/sonuç sayfaları; klinik süreçlere uygun yönlendirmeler.

## Neden Bu Proje?
- **Klinik akış odaklı**: Hasta→doktor iletişimi, bekleyen röntgenler, rol bazlı inceleme ve kayıt.
- **Ölçeklenebilir ve güvenli**: DynamoDB ile indeksli veri modeli; Cognito/Google OAuth ile giriş; sade ve test edilebilir Flask mimarisi.
- **Kullanıcı deneyimi**: Hızlı arayüz, anlaşılır sonuç sunumu ve rapor üretimi.

## Öğrendiklerim
- Katmanlı mimari ile sorumluluk ayrımı ve test edilebilirlik.
- Bilgisayarlı görü pipeline’ları ve YOLO ile üretim odaklı entegrasyon.
- AWS ekosisteminde kimlik, veri ve servis entegrasyonu (Cognito, DynamoDB).
- Güvenlik ve yetkilendirme desenleri (JWT, rol bazlı erişim).







—

• **Teknolojiler**: Flask, Ultralytics YOLO, OpenCV, React, Vite, Tailwind, AWS DynamoDB, AWS Cognito, Google OAuth, Gemini

• **Hashtag’ler**: #DentalAI #ComputerVision #YOLO #HealthcareAI #Flask #React #Tailwind #Vite #AWS #DynamoDB #Cognito #GoogleOAuth #LLM
