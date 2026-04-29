# Dental X-Ray AI Analiz Sistemi — Proje Dokümantasyonu

---

## İçindekiler

1. [Problem Tanımı ve Etkisi](#1-problem-tanımı-ve-etkisi)
2. [Hedef Kullanıcı](#2-hedef-kullanıcı)
3. [Proje Özeti ve Amacı](#3-proje-özeti-ve-amacı)
4. [Sistemin Genel Mimarisi](#4-sistemin-genel-mimarisi)
5. [Kullanılacak Teknolojiler](#5-kullanılacak-teknolojiler)
6. [Proje Takvimi ve Haftalık İş Paketleri](#6-proje-takvimi-ve-haftalık-iş-paketleri)

---

## 1. Problem Tanımı ve Etkisi

### 1.1 Mevcut Durum ve Sorun

Diş hekimliğinde tanı sürecinin en kritik adımlarından biri radyografik (röntgen) görüntülerin yorumlanmasıdır. Diş çürükleri, apseler, kemik kayıpları, impaksiyon durumları ve periodontal hastalıklar gibi patolojiler; büyük ölçüde diş röntgenlerinin dikkatli bir şekilde incelenmesiyle tespit edilmektedir.

Bu süreçte karşılaşılan başlıca problemler şunlardır:

- **Uzman bağımlılığı ve subjektif yorum**: Röntgen yorumlama, deneyim gerektiren bir süreçtir. Aynı görüntü iki farklı hekim tarafından farklı biçimlerde değerlendirilebilmektedir. Bu durum tanı tutarsızlığına yol açmaktadır.
- **Zaman baskısı**: Kliniklerde yoğun hasta trafiği nedeniyle hekimler her görüntüye yeterli süreyi ayıramamakta, bu da gözden kaçan bulgulara neden olmaktadır.
- **Deneyimsiz pratisyen hekim riski**: Yeni mezun ya da genel pratisyen hekimler, uzman radyologların fark edebildiği ince patolojik bulguları atlayabilmektedir.
- **Belgeleme ve raporlama yükü**: Analiz sonuçlarının manuel olarak sisteme girilmesi ve raporlanması, hem zaman kaybına hem de tutarsız kayıt tutmaya yol açmaktadır.
- **Dijitalleşme eksikliği**: Küçük ölçekli kliniklerin büyük çoğunluğu hasta kayıtlarını ve röntgen geçmişini dijital ortamda tutmamakta; bu durum takip süreçlerini zorlaştırmaktadır.

### 1.2 Etkisi

Bu problemlerin somut yansımaları şu biçimde özetlenebilir:

| Etki Alanı | Açıklama |
|---|---|
| **Halk sağlığı** | Erken dönemde tespit edilemeyen diş çürükleri ve apseler, sistemik enfeksiyonlara dönüşebilmektedir. |
| **Ekonomi** | Geç teşhis maliyeti, erken müdahale maliyetinin çok üzerindedir. |
| **Hekim verimliliği** | Tekrarlayan ve zaman alıcı görüntü yorumlama işleri hekim kapasitesini tüketmektedir. |
| **Hasta güveni** | Tanı belirsizlikleri ve uzun süreçler, hasta memnuniyetini olumsuz etkilemektedir. |

---

## 2. Hedef Kullanıcı

Dental X-Ray AI Analiz Sistemi, aşağıdaki kullanıcı profillerine hitap etmek üzere tasarlanacaktır:

### 2.1 Birincil Kullanıcılar

**Diş Hekimleri (Pratisyen)**
- Günlük klinik pratiğinde röntgen yorumlama desteğine ihtiyaç duyan genel diş hekimleri.
- Yükledikleri röntgeni yapay zeka destekli analize tabi tutarak ikinci bir görüş elde etmek isteyenler.

**Dental Radyoloji Uzmanları**
- Karmaşık vakalarda otomatik ön analiz ile iş yükünü hafifletmek isteyen uzmanlar.
- AI bulgularını kendi yorumlarıyla karşılaştırarak raporlama sürecini hızlandırmak isteyenler.

### 2.2 İkincil Kullanıcılar

**Klinik Yöneticileri / Kuruluş Yöneticileri**
- Bünyelerindeki diş hekimlerini ve hasta kayıtlarını yönetmek isteyen klinik sahipleri veya yöneticileri.
- Organizasyon genelinde analiz istatistiklerini ve hasta geçmişini takip eden yöneticiler.

**Diş Hekimliği Öğrencileri ve Asistanları**
- Röntgen yorumlama becerilerini geliştirmek için AI analizini eğitim aracı olarak kullananlar.

### 2.3 Kullanıcı İhtiyaç Özeti

| Kullanıcı | Temel İhtiyaç |
|---|---|
| Pratisyen Diş Hekimi | Hızlı, güvenilir ve otomatik bulgu tespiti |
| Radyoloji Uzmanı | Ön analiz raporlaması ve iş yükü azaltma |
| Klinik Yöneticisi | Hasta ve hekim yönetimi, kuruluş geneli görünürlük |
| Öğrenci / Asistan | Eğitim desteği ve karşılaştırmalı değerlendirme |

---

## 3. Proje Özeti ve Amacı

### 3.1 Proje Tanımı

**Dental X-Ray AI Analiz Sistemi**, diş röntgeni görüntülerini yapay zeka modelleri aracılığıyla otomatik olarak analiz eden, tespit edilen bulguları anlaşılır bir rapor hâline getiren ve klinik iş akışlarını dijitalleştiren web tabanlı bir platformdur.

Sistem; derin öğrenme tabanlı YOLO (You Only Look Once) nesne tespit modelini kullanarak röntgen görüntüsündeki patolojileri (çürük, apse, dolgu, implant, kemik kaybı vb.) yüksek doğrulukla tespit edecek ve hekime yönelik klinik öneriler üretecektir.

### 3.2 Temel Amaçlar

1. **Tanı Doğruluğunu Artırmak**: AI destekli ikinci görüş sağlayarak hekim hatalarını asgariye indirmek.
2. **Tanı Sürecini Hızlandırmak**: Saniyeler içinde otomatik analiz raporları üreterek hekim zamanını verimli kullanmak.
3. **Klinik Kayıtları Dijitalleştirmek**: Hasta geçmişi, analiz sonuçları ve klinik notlar için merkezi ve güvenli bir platform sunmak.
4. **Erişilebilirliği Artırmak**: Küçük kliniklerin de gelişmiş AI analizine kolayca erişebilmesini sağlamak.
5. **Ölçeklenebilir Altyapı Kurmak**: Bulut tabanlı mimari ile büyüyen hasta ve kuruluş verilerini yönetebilmek.

### 3.3 Temel Özellikler (Planlanmakta)

- YOLO tabanlı otomatik diş röntgeni analizi
- Çürük, apse, dolgu, implant ve diğer patolojilerin tespiti ile güven skoru hesaplaması
- Risk seviyesi sınıflandırması (Düşük / Orta / Yüksek)
- Klinik öneri üretimi
- PDF raporu oluşturma ve indirme
- Hasta yönetimi (ekleme, güncelleme, geçmiş görüntüleme)
- Organizasyon bazlı kullanıcı yönetimi
- Analiz geçmişi ve takip sistemi
- AWS Cognito ve Google OAuth ile güvenli kimlik doğrulama
- Karanlık mod ve tam responsive arayüz

---

## 4. Sistemin Genel Mimarisi

### 4.1 Mimari Yaklaşım

Sistem, **katmanlı (layered) mimari** ve **servis odaklı (service-oriented)** tasarım prensiplerine göre inşa edilecektir. Frontend, Backend ve Altyapı (Infrastructure) katmanları birbirinden bağımsız tutularak modülerlik ve bakım kolaylığı sağlanacaktır.

```
┌─────────────────────────────────────────────────────────────┐
│                        KULLANICI                            │
│              (Tarayıcı — React Web Uygulaması)              │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND KATMANI                         │
│              React 19 + Vite + Tailwind CSS                 │
│     (Kimlik Doğrulama · Görüntü Yükleme · Raporlama)        │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND KATMANI                          │
│                 Python Flask API Sunucusu                   │
│  ┌────────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│  │Auth Routes │ │Analysis Routes│ │Patient/Org/Note Routes │ │
│  └────────────┘ └──────────────┘ └────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Servis Katmanı (Services)                 │  │
│  │  AI Service · Analysis Service · Patient Service      │  │
│  │  User Service · Organization Service · Note Service   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────┬────────────────────────┬────────────────────────-─┘
           │                        │
           ▼                        ▼
┌─────────────────────┐  ┌──────────────────────────────────┐
│   AI MODEL KATMANI  │  │         AWS ALTYAPISI            │
│  YOLO (best.pt)     │  │  ┌─────────────┐ ┌────────────┐  │
│  OpenCV             │  │  │  DynamoDB   │ │  Cognito   │  │
│  NumPy / Pillow     │  │  │  (Veritabanı│ │  (Auth)    │  │
└─────────────────────┘  │  └─────────────┘ └────────────┘  │
                         └──────────────────────────────────┘
```

### 4.2 Veri Akışı

1. Kullanıcı web arayüzünden diş röntgeni görüntüsünü yükler.
2. Frontend görüntüyü Base64 veya multipart form olarak backend API'ye iletir.
3. Backend `AIService` üzerinden YOLO modeline görüntüyü işletir.
4. YOLO modeli tespit ettiği nesneleri, koordinatlarını ve güven skorlarını döndürür.
5. `AnalysisService` bu ham verileri işler; risk skoru, klinik öneriler ve raporlanabilir bir çıktı üretir.
6. Sonuç `DynamoDB`'ye kaydedilir ve frontend'e JSON olarak iletilir.
7. Kullanıcı sonuçları ekranda görüntüler ve isteğe bağlı olarak PDF rapor indirir.

### 4.3 Veritabanı Modeli (DynamoDB Tabloları)

| Tablo Adı | Birincil Anahtar | Açıklama |
|---|---|---|
| `DentalAI_Users` | `userId` | Kullanıcı hesap bilgileri |
| `DentalAI_Analyses` | `analysisId` | Röntgen analiz sonuçları ve geçmişi |
| `DentalAI_Patients` | `patientId` | Hasta kayıtları |
| `DentalAI_Organizations` | `organizationId` | Klinik / kuruluş bilgileri |
| `DentalAI_Notes` | `noteId` | Hekim klinik notları |

### 4.4 Güvenlik Mimarisi

- **Kimlik doğrulama**: AWS Cognito kullanıcı havuzu + Google OAuth 2.0
- **Yetkilendirme**: JWT tabanlı token doğrulama; her API isteğinde token kontrolü
- **Veri iletimi**: HTTPS üzerinden şifreli iletişim
- **Dosya doğrulama**: Yüklenen dosyalarda uzantı ve MIME türü kontrolü (yalnızca `.jpg`, `.jpeg`, `.png`)
- **Giriş doğrulama**: Tüm kullanıcı girdileri backend'de doğrulanacaktır

---

## 5. Kullanılacak Teknolojiler

### 5.1 Backend

| Teknoloji | Sürüm | Kullanım Amacı |
|---|---|---|
| **Python** | 3.10+ | Ana backend dili |
| **Flask** | Güncel | RESTful API sunucusu |
| **Flask-CORS** | Güncel | Cross-origin istek yönetimi |
| **Ultralytics YOLO** | Güncel | Diş patolojisi nesne tespiti |
| **OpenCV (cv2)** | Güncel | Görüntü işleme ve ön işlem |
| **NumPy** | Güncel | Sayısal matris işlemleri |
| **Pillow** | Güncel | Görüntü okuma ve dönüştürme |
| **PyJWT** | Güncel | JWT token oluşturma ve doğrulama |
| **python-jose** | Güncel | AWS Cognito JWT doğrulama |
| **boto3** | Güncel | AWS SDK — DynamoDB erişimi |
| **google-auth** | Güncel | Google OAuth token doğrulama |
| **python-dotenv** | Güncel | Ortam değişkeni yönetimi |

### 5.2 Frontend

| Teknoloji | Sürüm | Kullanım Amacı |
|---|---|---|
| **React** | 19 | Kullanıcı arayüzü oluşturma |
| **Vite** | 7.x | Hızlı geliştirme ve build aracı |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **React Router DOM** | 7.x | İstemci taraflı sayfa yönlendirme |
| **Axios** | Güncel | HTTP istek yönetimi |
| **AWS Amplify** | 6.x | Cognito ile kolay entegrasyon |
| **jsPDF + autoTable** | Güncel | PDF raporu oluşturma ve indirme |

### 5.3 AWS Altyapısı

| Servis | Kullanım Amacı |
|---|---|
| **AWS DynamoDB** | NoSQL veritabanı — kullanıcı, hasta, analiz verileri |
| **AWS Cognito** | Kullanıcı havuzu ve kimlik yönetimi |
| **AWS IAM** | Servis erişim kontrolleri ve güvenlik politikaları |

### 5.4 AI Modeli

| Bileşen | Detay |
|---|---|
| **Model Mimarisi** | YOLO (You Only Look Once) — nesne tespiti |
| **Model Dosyası** | `best_final.pt` — özel eğitilmiş ağırlıklar |
| **Tespit Kategorileri** | Çürük, apse, dolgu, implant ve diğer dental patolojiler |
| **Çıktılar** | Sınırlayıcı kutu (bounding box), güven skoru, sınıf etiketi |

### 5.5 Geliştirme Araçları

| Araç | Amaç |
|---|---|
| **Git / GitHub** | Sürüm kontrolü |
| **VS Code** | Kod geliştirme ortamı |
| **Postman** | API test ve doğrulama |
| **ESLint** | JavaScript kod kalitesi |
| **Python venv** | Bağımlılık izolasyonu |

---

## 6. Proje Takvimi ve Haftalık İş Paketleri

Proje toplam **12 hafta** olarak planlanmaktadır. Çalışmalar üç ana fazda ilerleyecektir: **Temel Altyapı**, **Temel İşlevsellik** ve **Tamamlama & Test**.

---

### Faz 1 — Temel Altyapı (Hafta 1–3)

#### Hafta 1 — Proje Kurulumu ve Ortam Hazırlığı

| # | İş Paketi | Açıklama |
|---|---|---|
| 1.1 | Geliştirme ortamı kurulumu | Python venv, Node.js, VS Code eklentileri |
| 1.2 | Proje iskelet yapısının oluşturulması | `backend/` ve `dental-ai-web/` dizin yapıları |
| 1.3 | Flask uygulamasının başlatılması | Temel `app.py`, CORS, Blueprint yapısı |
| 1.4 | React + Vite projesinin oluşturulması | Tailwind CSS entegrasyonu |
| 1.5 | AWS hesabı ve IAM yapılandırması | DynamoDB ve Cognito servis erişimleri |

#### Hafta 2 — Veritabanı ve Kimlik Doğrulama Altyapısı

| # | İş Paketi | Açıklama |
|---|---|---|
| 2.1 | DynamoDB tablo tanımları | Users, Analyses, Patients, Organizations, Notes |
| 2.2 | AWS Cognito kullanıcı havuzu kurulumu | App client, politikalar ve domain yapılandırması |
| 2.3 | Kayıt ve giriş API endpoint'leri | `POST /api/register`, `POST /api/login` |
| 2.4 | JWT middleware geliştirilmesi | Token doğrulama ve kullanıcı bağlamı |
| 2.5 | Frontend giriş ve kayıt sayfaları | Form yapıları, doğrulama, hata mesajları |

#### Hafta 3 — Google OAuth ve Temel Kullanıcı Akışları

| # | İş Paketi | Açıklama |
|---|---|---|
| 3.1 | Google OAuth 2.0 entegrasyonu | Backend token doğrulama servisi |
| 3.2 | AWS Amplify frontend entegrasyonu | Cognito ile token yönetimi |
| 3.3 | Kullanıcı profil API'si | Profil görüntüleme ve güncelleme |
| 3.4 | Rol bazlı yetkilendirme | `admin`, `doctor` rolleri ve erişim kontrolleri |
| 3.5 | Auth akışı uçtan uca testi | Kayıt → Giriş → Token → Korumalı endpoint |

---

### Faz 2 — Temel İşlevsellik (Hafta 4–9)

#### Hafta 4 — YOLO Modeli Entegrasyonu

| # | İş Paketi | Açıklama |
|---|---|---|
| 4.1 | YOLO model dosyasının yüklenmesi | `best_final.pt` ile `AIService` sınıfı |
| 4.2 | Görüntü ön işleme pipeline'ı | OpenCV ile boyutlandırma ve normalizasyon |
| 4.3 | Model çıktısının ayrıştırılması | Bounding box, güven skoru, sınıf etiketi |
| 4.4 | Model test endpoint'i | Tek görüntü için ham YOLO çıktısı döndürme |
| 4.5 | Model performans testi | Farklı röntgen örnekleri ile doğruluk değerlendirmesi |

#### Hafta 5 — Analiz Servisi ve API

| # | İş Paketi | Açıklama |
|---|---|---|
| 5.1 | `AnalysisService` geliştirme | YOLO bulgularını işleyip rapor formatına dönüştürme |
| 5.2 | Risk seviyesi hesaplama algoritması | Bulgu sayısı ve güven skoruna göre risk ataması |
| 5.3 | Klinik öneri üretimi | Bulgu tipine göre statik öneri metinleri |
| 5.4 | Analiz kaydetme (DynamoDB) | `DentalAI_Analyses` tablosuna yazma |
| 5.5 | `POST /api/analyze` endpoint'i | Tam analiz akışının API olarak sunulması |

#### Hafta 6 — Görüntü Yükleme ve Sonuç Ekranı

| # | İş Paketi | Açıklama |
|---|---|---|
| 6.1 | Frontend görüntü yükleme bileşeni | Sürükle-bırak ve dosya seçici |
| 6.2 | Dosya doğrulama | Uzantı, MIME türü ve boyut kontrolü |
| 6.3 | Yükleme ve analiz ilerleme göstergesi | Loading spinner ve aşama bilgisi |
| 6.4 | Sonuç ekranı tasarımı | Bulgular, güven skorları, risk seviyesi |
| 6.5 | Tespit kutularının görsel gösterimi | Görüntü üzerine bounding box render |

#### Hafta 7 — PDF Raporu ve Analiz Geçmişi

| # | İş Paketi | Açıklama |
|---|---|---|
| 7.1 | jsPDF ile rapor şablonu | Başlık, bulgular tablosu, öneriler bölümü |
| 7.2 | PDF indirme işlevi | Tek buton ile PDF oluşturma ve tarayıcıya indirme |
| 7.3 | `GET /api/analyses` endpoint'i | Kullanıcı analiz geçmişini listeleme |
| 7.4 | Analiz geçmişi sayfası | Liste görünümü, tarih ve risk filtresi |
| 7.5 | Geçmiş analiz detay görünümü | Kaydedilmiş sonuçları tekrar görüntüleme |

#### Hafta 8 — Hasta Yönetimi

| # | İş Paketi | Açıklama |
|---|---|---|
| 8.1 | `PatientService` ve CRUD API'leri | Hasta ekleme, listeleme, güncelleme |
| 8.2 | Hastaya röntgen yükleme akışı | Analizi doğrudan hasta kaydına bağlama |
| 8.3 | `DentalAI_Notes` tablosu ve API | Hastaya not ekleme, listeleme |
| 8.4 | Hasta yönetimi sayfası | Arama, filtreleme ve hasta kartları |
| 8.5 | Hasta profil sayfası | Geçmiş analizler ve klinik notlar |

#### Hafta 9 — Organizasyon ve Dashboard

| # | İş Paketi | Açıklama |
|---|---|---|
| 9.1 | `OrganizationService` ve API | Organizasyon oluşturma ve üye yönetimi |
| 9.2 | Admin dashboard | Organizasyon geneli istatistikler |
| 9.3 | Doktor dashboard | Kişisel analiz ve hasta özeti |
| 9.4 | Kullanıcı yönetim paneli | Admin tarafından hekim yönetimi |
| 9.5 | Rol bazlı sayfa yönlendirme | Admin/Doctor ayrımına göre yönlendirme |

---

### Faz 3 — Tamamlama ve Test (Hafta 10–12)

#### Hafta 10 — Arayüz Geliştirme ve Dark Mode

| # | İş Paketi | Açıklama |
|---|---|---|
| 10.1 | Dark / Light mod geçişi | Tailwind dark mode ile tema yönetimi |
| 10.2 | Responsive düzenlemeler | Mobil ve tablet uyumluluğu |
| 10.3 | Loading state'leri ve hata mesajları | Tüm async işlemler için kullanıcı geri bildirimi |
| 10.4 | Header, Footer ve Layout bileşenleri | Tutarlı sayfa düzeni |
| 10.5 | Erişilebilirlik (a11y) kontrolleri | ARIA attribute'ları ve klavye navigasyonu |

#### Hafta 11 — Test ve Hata Giderme

| # | İş Paketi | Açıklama |
|---|---|---|
| 11.1 | Backend birim testleri | Servis ve utility fonksiyonları için testler |
| 11.2 | API entegrasyon testleri | Tüm endpoint'lerin Postman ile doğrulanması |
| 11.3 | Frontend fonksiyonel testler | Kullanıcı akışlarının uçtan uca test edilmesi |
| 11.4 | Güvenlik testleri | JWT bypass, dosya yükleme ve injection denemeleri |
| 11.5 | Performans testi | Büyük görüntüler ve eş zamanlı istekler ile yük testi |

#### Hafta 12 — Dağıtım ve Dokümantasyon

| # | İş Paketi | Açıklama |
|---|---|---|
| 12.1 | Ortam değişkenlerinin hazırlanması | `.env` dosyası ve production konfigürasyonu |
| 12.2 | Backend deployment | Üretim sunucusu yapılandırması |
| 12.3 | Frontend build ve deployment | `vite build` çıktısı statik servis |
| 12.4 | Sistem dokümantasyonunun tamamlanması | API referansı, kurulum kılavuzu |
| 12.5 | Son kullanıcı testi | Gerçek klinik verileriyle kabul testi |

---

### Proje Zaman Çizelgesi Özeti

```
Hafta  1  2  3  4  5  6  7  8  9  10 11 12
       ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
Faz 1  ████████████
Faz 2              ████████████████████
Faz 3                                ██████
```

| Faz | Hafta Aralığı | Kapsam |
|---|---|---|
| **Faz 1** — Temel Altyapı | Hafta 1–3 | Kurulum, kimlik doğrulama, veritabanı |
| **Faz 2** — Temel İşlevsellik | Hafta 4–9 | AI analizi, hasta yönetimi, dashboard |
| **Faz 3** — Tamamlama | Hafta 10–12 | UI polish, test, deployment |

---

*Bu doküman, Dental X-Ray AI Analiz Sistemi projesinin planlama aşamasında hazırlanmış olup proje ilerledikçe güncellenecektir.*
