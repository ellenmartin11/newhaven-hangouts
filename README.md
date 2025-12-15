# 🎯 New Haven HangOut

A mobile-first location-based social application where users can check in to locations in New Haven, CT and see where their friends are hanging out.

## ✨ Features

- 🔐 **Email Authentication**: Secure signup and login with email and password
- 👥 **Friends System**: Add friends by email, accept/reject friend requests
- 📍 **Location Check-ins**: Share your current location with friends
- 🔍 **Location Search**: Search for places in New Haven with autocomplete
- 🗺️ **Interactive Map**: View friend check-ins on an OpenStreetMap-powered interface
- 📋 **List View**: Alternative list view for check-ins
- 🎉 **"I'm Coming" Feature**: Let friends know you're joining them
- 👥 **Attendee Tracking**: See who's coming to each check-in
- ⏰ **Expiring Check-ins**: Check-ins automatically expire after a set duration
- 📱 **Mobile-First Design**: Optimized for mobile browsers with responsive design

## 🛠️ Tech Stack

- **Backend**: Python (Flask)
- **Database**: Supabase (PostgreSQL with PostGIS)
- **Frontend**: HTML/JavaScript
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Hosting**: Vercel-ready configuration

## 📋 Prerequisites

- Python 3.8+
- Supabase account ([sign up here](https://supabase.com))
- Node.js (optional, for development tools)

## 🚀 Setup Instructions

### 1. Database Setup

1. Create a new Supabase project
2. Enable the PostGIS extension:
   - Go to the SQL Editor in your Supabase dashboard
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Create the database schema:
   - Copy the contents of `schema.sql`
   - Run it in the SQL Editor

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

   You can find these in your Supabase project settings under "API".

### 3. Install Dependencies

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 📱 Usage

1. **Sign Up / Login**: 
   - Create a new account with username, email, and password
   - Or login with existing credentials
2. **Add Friends**:
   - Click the "Friends" button in the header
   - Enter a friend's email address to send a friend request
   - Accept or reject incoming friend requests
3. **Check In**: 
   - Click the "Check In" button
   - Search for a location or use your current GPS location
   - Enter an optional message
   - Select how long you'll be there
4. **View Friends**: Switch between Map and List views to see your friends' check-ins
5. **Join Friends**: Click "I'm Coming!" to notify them you're coming

## 🌐 Deployment to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

## 🗺️ Setting Up Friendships

For testing, you can manually add friendships in the Supabase Table Editor:

```sql
-- Example: Make Ellen and Sam friends
INSERT INTO friendships (user_id, friend_id, status)
SELECT u1.id, u2.id, 'accepted'
FROM users u1, users u2
WHERE u1.username = 'Ellen' AND u2.username = 'Sam';
```

## 📊 Database Schema

- **users**: User accounts with username, email, and password hash
- **friendships**: Friend relationships with status (pending/accepted/rejected)
- **checkins**: Location check-ins with PostGIS geometry and expiration time
- **attendees**: Tracks who's coming to each check-in

## 🎨 Customization

### Change Default Location

Edit `static/js/app.js`, line 58:
```javascript
map = L.map('map').setView([YOUR_LAT, YOUR_LNG], 13);
```

### Modify Check-in Duration Options

Edit `templates/index.html`, lines 48-53 to add/remove duration options.

### Customize Map Tiles

Replace the OpenStreetMap tile layer in `static/js/app.js` with any other tile provider:
```javascript
L.tileLayer('YOUR_TILE_URL', {
    attribution: 'Your attribution'
}).addTo(map);
```

## 🔒 Security Notes

- Email/password authentication with bcrypt password hashing
- Flask-Login for session management
- For production:
  - Use a strong SECRET_KEY (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
  - Enable HTTPS
  - Add rate limiting to prevent API abuse
  - Consider adding email verification
  - Implement CSRF protection

## 🚧 Future Enhancements

- [x] Email/password authentication
- [x] Friend request system
- [x] Location search
- [x] List view for check-ins
- [x] Attendee tracking
- [ ] Push notifications via FCM
- [ ] Check-in photos
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Activity feed/timeline
- [ ] Search for locations
- [ ] Private/public check-ins
- [ ] User profiles

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for the New Haven community
