"""
AWS DynamoDB bağlantı ve yardımcı fonksiyonlar
"""
import boto3
from botocore.exceptions import ClientError
from config.settings import Config

class DynamoDBClient:
    """DynamoDB client singleton"""
    _instance = None
    _dynamodb = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DynamoDBClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """DynamoDB bağlantısını başlat"""
        try:
            # AWS credentials kontrolü
            if not Config.AWS_ACCESS_KEY_ID or not Config.AWS_SECRET_ACCESS_KEY:
                print("⚠️  AWS credentials bulunamadı - .env dosyasını kontrol edin")
                self._dynamodb = None
                self._client = None
                return
            
            # DynamoDB client oluştur
            session = boto3.Session(
                aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
                region_name=Config.AWS_REGION
            )
            
            # Resource ve client oluştur
            if Config.DYNAMODB_ENDPOINT:
                # Local DynamoDB
                self._dynamodb = session.resource('dynamodb', endpoint_url=Config.DYNAMODB_ENDPOINT)
                self._client = session.client('dynamodb', endpoint_url=Config.DYNAMODB_ENDPOINT)
                print(f"🔗 Local DynamoDB'ye bağlanıldı: {Config.DYNAMODB_ENDPOINT}")
            else:
                # AWS DynamoDB
                self._dynamodb = session.resource('dynamodb')
                self._client = session.client('dynamodb')
                print(f"🔗 AWS DynamoDB'ye bağlanıldı: {Config.AWS_REGION}")
            
            # Tabloları oluştur
            self._create_tables()
            
        except Exception as e:
            print(f"❌ DynamoDB bağlantı hatası: {e}")
            self._dynamodb = None
            self._client = None
    
    def _create_tables(self):
        """DynamoDB tablolarını oluştur (yoksa)"""
        if not self._dynamodb:
            return
        
        tables = [
            {
                'TableName': Config.USERS_TABLE,
                'KeySchema': [
                    {'AttributeName': 'email', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'email', 'AttributeType': 'S'}
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.ANALYSES_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'user_email', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'UserEmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'user_email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.PATIENTS_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.ORGANIZATIONS_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.NOTES_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'patient_id', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'PatientIdIndex',
                        'KeySchema': [
                            {'AttributeName': 'patient_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.FEEDBACKS_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'patient_email', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'PatientEmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'patient_email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            },
            {
                'TableName': Config.APPOINTMENTS_TABLE,
                'KeySchema': [
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                'AttributeDefinitions': [
                    {'AttributeName': 'id', 'AttributeType': 'S'},
                    {'AttributeName': 'patient_email', 'AttributeType': 'S'},
                    {'AttributeName': 'doctor_email', 'AttributeType': 'S'}
                ],
                'GlobalSecondaryIndexes': [
                    {
                        'IndexName': 'PatientEmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'patient_email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    },
                    {
                        'IndexName': 'DoctorEmailIndex',
                        'KeySchema': [
                            {'AttributeName': 'doctor_email', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                'BillingMode': 'PAY_PER_REQUEST'
            }
        ]

        existing_tables = self._client.list_tables()['TableNames']
        
        for table_config in tables:
            table_name = table_config['TableName']
            if table_name not in existing_tables:
                try:
                    self._dynamodb.create_table(**table_config)
                    print(f"✅ Tablo oluşturuldu: {table_name}")
                except ClientError as e:
                    if e.response['Error']['Code'] != 'ResourceInUseException':
                        print(f"❌ Tablo oluşturma hatası ({table_name}): {e}")
            else:
                print(f"ℹ️  Tablo zaten mevcut: {table_name}")
    
    @property
    def dynamodb(self):
        """DynamoDB resource'u döndür"""
        return self._dynamodb
    
    @property
    def client(self):
        """DynamoDB client'ı döndür"""
        return self._client
    
    @property
    def is_connected(self):
        """DynamoDB bağlantısı aktif mi?"""
        return self._dynamodb is not None

# Singleton instance
dynamodb_client = DynamoDBClient()
