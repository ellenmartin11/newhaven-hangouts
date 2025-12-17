"""
New Haven Hangouts - Flask Backend
A location-based social app for checking in and meeting friends
"""

from flask import Flask, request, jsonify, render_template, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
# Use Service Role Key if available (for backend RLS bypass), otherwise fallback to Anon Key
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'


# User class for Flask-Login
class User(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email


@login_manager.user_loader
def load_user(user_id):
    # Don't wrap in try/except to avoid silencing DB errors
    # If DB is down, we want 500, not to log the user out!
    response = supabase.table('users').select('*').eq('id', user_id).execute()
    if response.data and len(response.data) > 0:
        user_data = response.data[0]
        return User(user_data['id'], user_data['username'], user_data['email'])
    return None



# ==================== ROUTES ====================

@app.route('/')
def index():
    """Serve the main application page"""
    return render_template('index.html')


@app.route('/friends')
def friends_page():
    """Serve the friends page"""
    return render_template('friends.html')


@app.route('/about')
def about_page():
    """Serve the about page"""
    return render_template('about.html')


@app.route('/stats')
def stats_page():
    """Serve the stats page"""
    return render_template('stats.html')


@app.route('/api/signup', methods=['POST'])
def signup():
    """
    User signup endpoint
    Accepts: { "username": "Ellen", "email": "ellen@example.com", "password": "password123" }
    Returns: { "user_id": "uuid", "username": "Ellen", "email": "ellen@example.com" }
    """
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'Username, email, and password required'}), 400
        
        # Check if user exists with this email
        response = supabase.table('users').select('*').eq('email', email).execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Create new user
        new_user = supabase.table('users').insert({
            'username': username,
            'email': email,
            'password_hash': password_hash
        }).execute()
        
        if new_user.data and len(new_user.data) > 0:
            user_data = new_user.data[0]
            user = User(user_data['id'], user_data['username'], user_data['email'])
            login_user(user)
            
            return jsonify({
                'user_id': user_data['id'],
                'username': user_data['username'],
                'email': user_data['email']
            }), 201
        else:
            return jsonify({'error': 'Failed to create user'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """
    User login endpoint
    Accepts: { "email": "ellen@example.com", "password": "password123" }
    Returns: { "user_id": "uuid", "username": "Ellen", "email": "ellen@example.com" }
    """
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user exists
        response = supabase.table('users').select('*').eq('email', email).execute()
        
        if not response.data or len(response.data) == 0:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user_data = response.data[0]
        
        # Verify password
        if not check_password_hash(user_data['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Log in user
        user = User(user_data['id'], user_data['username'], user_data['email'])
        login_user(user)
        
        return jsonify({
            'user_id': user_data['id'],
            'username': user_data['username'],
            'email': user_data['email']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """Logout the current user"""
    logout_user()
    return jsonify({'success': True}), 200


@app.route('/api/current_user', methods=['GET'])
def get_current_user():
    """Get current logged-in user"""
    if current_user.is_authenticated:
        return jsonify({
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }), 200
    return jsonify({'error': 'Not authenticated'}), 401


@app.route('/api/stats/user', methods=['GET'])
@login_required
def get_user_stats():
    """
    Get stats for the current user and community
    Returns: {
        "total_checkins": 15,
        "favorite_places": [{"location_name": "Koffee", "count": 5}, ...],
        "community_top_place": {"location_name": "The Stack", "count": 42}
    }
    """
    try:
        # 1. Total Check-ins for current user
        total_response = supabase.table('checkins').select('*', count='exact').eq('user_id', current_user.id).execute()
        total_checkins = total_response.count if total_response.count is not None else len(total_response.data)
        
        # 2. Favorite Places for current user (Client-side aggregation required if no advanced SQL view)
        # Note: Supabase JS/store procedures are ideal, but for now we fetch user's checkins and aggregate in Python
        # Fetch only location names for efficiency
        # Using a limit of 1000 for now, ideally we'd paginate or use a specialized query
        user_checkins_response = supabase.table('checkins').select('location_name').eq('user_id', current_user.id).limit(1000).execute()
        
        from collections import Counter
        user_locations = [c['location_name'] for c in user_checkins_response.data]
        user_location_counts = Counter(user_locations)
        favorite_places = [
            {'location_name': loc, 'count': count}
            for loc, count in user_location_counts.most_common(3)
        ]
        
        # 3. Community Top Place
        # Fetch all checkins (limited) or create a DB view. For MVP, we'll fetch a batch.
        # Ideally: Create a Postgres VIEW for this. 
        # Fallback: Fetch last N global checkins and aggregate, or reliance on a future View.
        # Let's try to fetch checkins and aggregate in Python for now (MVP scale).
        all_checkins_response = supabase.table('checkins').select('location_name').limit(2000).execute()
        all_locations = [c['location_name'] for c in all_checkins_response.data]
        all_location_counts = Counter(all_locations)
        top_place_data = all_location_counts.most_common(1)
        
        community_top_place = None
        if top_place_data:
            community_top_place = {
                'location_name': top_place_data[0][0],
                'count': top_place_data[0][1]
            }
            
        return jsonify({
            'total_checkins': total_checkins,
            'favorite_places': favorite_places,
            'community_top_place': community_top_place
        }), 200
        
    except Exception as e:
        print(f"Error fetching stats: {e}")
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


# ==================== FRIENDS ROUTES ====================

@app.route('/api/friends/add', methods=['POST'])
@login_required
def add_friend():
    """
    Send a friend request by email
    Accepts: { "friend_email": "friend@example.com" }
    """
    try:
        data = request.json
        friend_email = data.get('friend_email')
        
        if not friend_email:
            return jsonify({'error': 'Friend email required'}), 400
        
        # Find the friend by email
        friend_response = supabase.table('users').select('*').eq('email', friend_email).execute()
        
        if not friend_response.data or len(friend_response.data) == 0:
            return jsonify({'error': 'User with that email not found'}), 404
        
        friend = friend_response.data[0]
        friend_id = friend['id']
        
        # Can't add yourself
        if friend_id == current_user.id:
            return jsonify({'error': 'Cannot add yourself as a friend'}), 400
        
        # Check if friendship already exists
        existing = supabase.table('friendships').select('*').eq(
            'user_id', current_user.id
        ).eq('friend_id', friend_id).execute()
        
        if existing.data and len(existing.data) > 0:
            status = existing.data[0]['status']
            if status == 'pending':
                return jsonify({'error': 'Friend request already pending'}), 400
            elif status == 'accepted':
                return jsonify({'error': 'Already friends'}), 400
        
        # Check if the reverse friendship exists (they added you)
        reverse = supabase.table('friendships').select('*').eq(
            'user_id', friend_id
        ).eq('friend_id', current_user.id).execute()
        
        if reverse.data and len(reverse.data) > 0:
            # If they sent you a request, this should accept it instead
            if reverse.data[0]['status'] == 'pending':
                # Accept their request
                supabase.table('friendships').update({
                    'status': 'accepted'
                }).eq('user_id', friend_id).eq('friend_id', current_user.id).execute()
                
                # Create the reverse friendship
                supabase.table('friendships').insert({
                    'user_id': current_user.id,
                    'friend_id': friend_id,
                    'status': 'accepted'
                }).execute()
                
                return jsonify({
                    'success': True,
                    'message': f'You are now friends with {friend["username"]}!'
                }), 201
        
        # Create friend request
        supabase.table('friendships').insert({
            'user_id': current_user.id,
            'friend_id': friend_id,
            'status': 'pending'
        }).execute()
        
        return jsonify({
            'success': True,
            'message': f'Friend request sent to {friend["username"]}'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/friends/requests', methods=['GET'])
@login_required
def get_friend_requests():
    """Get pending friend requests for current user"""
    try:
        # Get pending requests where you are the friend
        requests_response = supabase.table('friendships').select(
            '*, users!friendships_user_id_fkey(id, username, email)'
        ).eq('friend_id', current_user.id).eq('status', 'pending').execute()
        
        requests = [
            {
                'request_id': req['user_id'],
                'user_id': req['users']['id'],
                'username': req['users']['username'],
                'email': req['users']['email'],
                'created_at': req['created_at']
            }
            for req in requests_response.data
        ]
        
        return jsonify({'requests': requests}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/friends/accept', methods=['POST'])
@login_required
def accept_friend_request():
    """
    Accept a friend request
    Accepts: { "user_id": "uuid" }
    """
    try:
        data = request.json
        requester_id = data.get('user_id')
        
        if not requester_id:
            return jsonify({'error': 'user_id required'}), 400
        
        # Update the original request to accepted
        supabase.table('friendships').update({
            'status': 'accepted'
        }).eq('user_id', requester_id).eq('friend_id', current_user.id).execute()
        
        # Create the reverse friendship
        supabase.table('friendships').insert({
            'user_id': current_user.id,
            'friend_id': requester_id,
            'status': 'accepted'
        }).execute()
        
        return jsonify({
            'success': True,
            'message': 'Friend request accepted'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/friends/reject', methods=['POST'])
@login_required
def reject_friend_request():
    """
    Reject a friend request
    Accepts: { "user_id": "uuid" }
    """
    try:
        data = request.json
        requester_id = data.get('user_id')
        
        if not requester_id:
            return jsonify({'error': 'user_id required'}), 400
        
        # Delete the friend request
        supabase.table('friendships').delete().eq(
            'user_id', requester_id
        ).eq('friend_id', current_user.id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Friend request rejected'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/friends', methods=['GET'])
@login_required
def get_friends():
    """Get list of accepted friends for current user"""
    try:
        # Get accepted friendships
        friends_response = supabase.table('friendships').select(
            '*, users!friendships_friend_id_fkey(id, username, email)'
        ).eq('user_id', current_user.id).eq('status', 'accepted').execute()
        
        friends = [
            {
                'user_id': friend['users']['id'],
                'username': friend['users']['username'],
                'email': friend['users']['email']
            }
            for friend in friends_response.data
        ]
        
        return jsonify({'friends': friends}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# For Vercel, the app object is imported directly
# For local development:
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
