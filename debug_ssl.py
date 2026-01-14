
import httpx
import certifi
import ssl
import os

print(f"Certifi location: {certifi.where()}")
print(f"OpenSSL version: {ssl.OPENSSL_VERSION}")

try:
    print("Testing connection to google.com...")
    with httpx.Client() as client:
        r = client.get("https://google.com")
        print(f"Google status: {r.status_code}")
except Exception as e:
    print(f"Google failed: {e}")

try:
    print("Testing connection to supabase using certifi...")
    # Simulate what we might do to fix it: use certifi explicitly
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with httpx.Client(verify=ssl_context) as client:
         r = client.get("https://google.com")
         print(f"Google with certifi status: {r.status_code}")
except Exception as e:
    print(f"Google with certifi failed: {e}")
