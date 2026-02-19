import firebase_admin
from firebase_admin import credentials, messaging
import os

# Use the token the user successfully used in curl
DEVICE_TOKEN = "dGoeN9SUSF6OlaVs5bzFg7:APA91bGd_fMUPjFgIIW3kuHWR3FV8exh9Xb-h7zKNNQ_6eHLWNU930ZEDmELzUT-x4Q2eaxHdREpEjepga-4k2Xux7JXc7qLZCRUMfZxuiE9izLAl6-aCe8"

cred_path = 'serviceAccountKey.json'
print(f"Loading credentials from {cred_path}...")

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("Firebase Admin initialized successfully.")

    message = messaging.Message(
        notification=messaging.Notification(
            title="Backend Test",
            body="This is a test from the Python backend credentials."
        ),
        token=DEVICE_TOKEN,
        android=messaging.AndroidConfig(
            priority='high',
            notification=messaging.AndroidNotification(
                channel_id='hangouts_alerts_v2',
                default_sound=True,
                default_vibrate_timings=True,
                visibility='public'
            ),
        )
    )

    print(f"Sending notification to {DEVICE_TOKEN[:20]}...")
    response = messaging.send(message)
    print('Successfully sent message:', response)

except Exception as e:
    print('FAILED to send message:', e)
