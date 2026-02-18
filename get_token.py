import google.auth
from google.auth.transport.requests import Request
from google.oauth2 import service_account

# Path to your service account key
KEY_FILE = 'serviceAccountKey.json' 
SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']

def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        KEY_FILE, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token

print(get_access_token())