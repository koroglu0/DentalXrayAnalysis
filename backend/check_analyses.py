import sys
sys.path.insert(0, '.')
from config.settings import Config
from utils.dynamodb_client import dynamodb_client

table = dynamodb_client.dynamodb.Table(Config.ANALYSES_TABLE)
resp = table.scan()
for item in resp.get('Items', []):
    print('ID:', item.get('id'))
    print('  ALL KEYS:', list(item.keys()))
    print('  image_s3_key:', repr(item.get('image_s3_key', 'NOT_FOUND')))
    print('  image_url:', repr(item.get('image_url', 'NOT_FOUND')))
    print('  status:', item.get('status'))
