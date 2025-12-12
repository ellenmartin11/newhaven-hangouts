"""
New Haven Hangouts - Flask Backend
A location-based social app for checking in and meeting friends
"""

from flask import Flask, request, jsonify, render_template
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==================== ROUTES ====================

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
def login():
    """
    Mock login endpoint for MVP
    Accepts: { "username": "Ellen" }
    Returns: { "user_id": "uuid", "username": "Ellen" }
    """
    try:
        data = request.json
        username = data.get('username')
        
        if not username:
            return jsonify({'error': 'Username required'}), 400
        
        # Check if user exists
        response = supabase.table('users').select('*').eq('username', username).execute()
        
        if response.data and len(response.data) > 0:
            user = response.data[0]
        else:
            # Create new user
            new_user = supabase.table('users').insert({
                'username': username
            }).execute()
            user = new_user.data[0]
        
        return jsonify({
            'user_id': user['id'],
            'username': user['username']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/checkin', methods=['POST'])
def checkin():
    """
    Create a new check-in
    Accepts: {
        "user_id": "uuid",
        "lat": 41.308,
        "lng": -72.927,
        "location_name": "The Stack",
        "message": "Grabbing coffee!",
        "duration_minutes": 60
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        lat = data.get('lat')
        lng = data.get('lng')
        location_name = data.get('location_name', 'Unknown Location')
        message = data.get('message', '')
        duration_minutes = data.get('duration_minutes', 60)
        
        # Validate inputs
        if not all([user_id, lat, lng]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        
        # Create PostGIS point geometry
        # Format: POINT(longitude latitude)
        geom = f'POINT({lng} {lat})'
        
        # Insert check-in
        response = supabase.table('checkins').insert({
            'user_id': user_id,
            'location_name': location_name,
            'geom': geom,
            'message': message,
            'expires_at': expires_at.isoformat() + 'Z'  # Add Z to indicate UTC
        }).execute()
        
        if response.data:
            return jsonify({
                'success': True,
                'checkin': response.data[0]
            }), 201
        else:
            return jsonify({'error': 'Failed to create check-in'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/feed', methods=['GET'])
def feed():
    """
    Get active check-ins from friends
    Query params: user_id
    Returns: Array of check-ins with user info
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        
        # Get list of friends (accepted friendships)
        friends_response = supabase.table('friendships').select('friend_id').eq(
            'user_id', user_id
        ).eq('status', 'accepted').execute()
        
        friend_ids = [f['friend_id'] for f in friends_response.data]
        
        # Also include the user's own check-ins
        friend_ids.append(user_id)
        
        # Get active check-ins from friends
        # Note: Supabase will return geom as GeoJSON
        now = datetime.utcnow().isoformat() + 'Z'  # Add Z to indicate UTC
        
        checkins_response = supabase.table('checkins').select(
            '*, users!checkins_user_id_fkey(username)'
        ).in_(
            'user_id', friend_ids
        ).gt(
            'expires_at', now
        ).order('created_at', desc=True).execute()
        
        # Format response with coordinates extracted from geometry
        formatted_checkins = []
        for checkin in checkins_response.data:
            # Parse geometry to get coordinates
            geom = checkin.get('geom')
            
            # If geom is a dict with coordinates (GeoJSON format)
            if isinstance(geom, dict) and 'coordinates' in geom:
                lng, lat = geom['coordinates']
            else:
                # Fallback: try to parse WKT format if needed
                lat, lng = 0, 0
            
            # Get attendees for this check-in
            attendees_response = supabase.table('attendees').select(
                'user_id, users!attendees_user_id_fkey(username)'
            ).eq('checkin_id', checkin['id']).execute()
            
            attendees = [
                {
                    'user_id': att['user_id'],
                    'username': att['users']['username']
                }
                for att in attendees_response.data
            ]
            
            # Ensure timestamps have Z suffix for proper timezone handling
            expires_at = checkin['expires_at']
            if not expires_at.endswith('Z'):
                expires_at = expires_at + 'Z'
            
            created_at = checkin['created_at']
            if not created_at.endswith('Z'):
                created_at = created_at + 'Z'
            
            formatted_checkins.append({
                'id': checkin['id'],
                'user_id': checkin['user_id'],
                'username': checkin['users']['username'] if checkin.get('users') else 'Unknown',
                'location_name': checkin['location_name'],
                'message': checkin['message'],
                'lat': lat,
                'lng': lng,
                'expires_at': expires_at,
                'created_at': created_at,
                'attendees': attendees
            })
        
        return jsonify({'checkins': formatted_checkins}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/coming', methods=['POST'])
def coming():
    """
    Mark user as coming to a check-in
    Accepts: {
        "user_id": "uuid",
        "checkin_id": "uuid"
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        checkin_id = data.get('checkin_id')
        
        if not all([user_id, checkin_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if already marked as coming
        existing = supabase.table('attendees').select('*').eq(
            'checkin_id', checkin_id
        ).eq('user_id', user_id).execute()
        
        if existing.data and len(existing.data) > 0:
            return jsonify({'message': 'Already marked as coming'}), 200
        
        # Insert attendee record
        response = supabase.table('attendees').insert({
            'checkin_id': checkin_id,
            'user_id': user_id,
            'status': 'coming'
        }).execute()
        
        # Get check-in owner for notification
        checkin = supabase.table('checkins').select(
            '*, users!checkins_user_id_fkey(username, fcm_token)'
        ).eq('id', checkin_id).execute()
        
        if checkin.data and len(checkin.data) > 0:
            owner = checkin.data[0]['users']
            location = checkin.data[0]['location_name']
            
            # Get the person who is coming
            comer = supabase.table('users').select('username').eq('id', user_id).execute()
            comer_name = comer.data[0]['username'] if comer.data else 'Someone'
            
            # Mock notification (in production, send via FCM)
            print(f"📱 NOTIFICATION to {owner['username']}: {comer_name} is coming to your check-in at {location}!")
        
        return jsonify({
            'success': True,
            'message': 'Marked as coming'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/checkin/<checkin_id>', methods=['DELETE'])
def delete_checkin(checkin_id):
    """
    Delete a check-in (only by owner)
    Accepts: {
        "user_id": "uuid"
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        
        # Verify the check-in belongs to the user
        checkin = supabase.table('checkins').select('user_id').eq('id', checkin_id).execute()
        
        if not checkin.data or len(checkin.data) == 0:
            return jsonify({'error': 'Check-in not found'}), 404
        
        if checkin.data[0]['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized - you can only delete your own check-ins'}), 403
        
        # Delete the check-in (attendees will be cascade deleted)
        supabase.table('checkins').delete().eq('id', checkin_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Check-in deleted'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
