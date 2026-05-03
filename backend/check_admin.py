import sys
sys.path.insert(0, '.')
from config.settings import Config
from utils.dynamodb_client import dynamodb_client

table = dynamodb_client.dynamodb.Table(Config.USERS_TABLE)
resp = table.scan()
for item in resp.get('Items', []):
    if item.get('role') == 'admin':
        print('ADMIN FIELDS:', list(item.keys()))
        print('cognito_sub:', item.get('cognito_sub', 'YOK'))
        print('email:', item.get('email'))
        print('role:', item.get('role'))
