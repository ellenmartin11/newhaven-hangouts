import google.auth
from google.auth.transport.requests import Request
from google.oauth2 import service_account

# Path to the service account JSON you downloaded from Firebase
KEY_FILE = 'serviceAccountKey.json' 
SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']

def get_access_token():
    creds = service_account.Credentials.from_service_account_file(
        KEY_FILE, scopes=SCOPES)
    creds.refresh(Request())
    return creds.token

print(f"Your Access Token:\n{get_access_token()}")