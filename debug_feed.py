"""
Quick test script to debug the feed endpoint
"""
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test fetching check-ins
user_id = '8314e188-87ce-4212-959e-440a86c2c271'

# Get friends
friends_response = supabase.table('friendships').select('friend_id').eq(
    'user_id', user_id
).eq('status', 'accepted').execute()

friend_ids = [f['friend_id'] for f in friends_response.data]
friend_ids.append(user_id)

print(f"Friend IDs: {friend_ids}")

# Get check-ins
now = datetime.utcnow().isoformat()

checkins_response = supabase.table('checkins').select(
    '*, users(username)'
).in_(
    'user_id', friend_ids
).gt(
    'expires_at', now
).execute()

print(f"\nCheck-ins found: {len(checkins_response.data)}")

for checkin in checkins_response.data:
    print(f"\nCheck-in ID: {checkin['id']}")
    print(f"User: {checkin['users']['username']}")
    print(f"Location: {checkin['location_name']}")
    print(f"Geometry type: {type(checkin.get('geom'))}")
    print(f"Geometry value: {checkin.get('geom')}")
