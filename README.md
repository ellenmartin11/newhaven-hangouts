# 🎯 New Haven HangOut

A mobile-first location-based social application where users can check in to locations in New Haven, CT and see where their friends are hanging out.

## ✨ Features

- 📍 **Location Check-ins**: Share your current location with friends
- 🗺️ **Interactive Map**: View friend check-ins on an OpenStreetMap-powered interface
- 🎉 **"I'm Coming" Feature**: Let friends know you're joining them
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

1. **First-time Login**: Enter a username to create your account
2. **Check In**: 
   - Click the "Check In" button
   - Allow location access when prompted
   - Enter a location name and optional message
   - Select how long you'll be there
3. **View Friends**: See your friends' check-ins as markers on the map
4. **Join Friends**: Click on a marker and press "I'm Coming!" to notify them

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

- **users**: User accounts with username and notification tokens
- **friendships**: Friend relationships with status (pending/accepted/rejected)
- **checkins**: Location check-ins with PostGIS geometry
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

- This is an MVP and uses a simplified login system
- For production, implement proper authentication (e.g., Supabase Auth, OAuth)
- Add rate limiting to prevent API abuse
- Validate and sanitize all user inputs
- Use HTTPS in production

## 🚧 Future Enhancements

- [ ] Real authentication with Supabase Auth
- [ ] Push notifications via FCM
- [ ] Friend request system
- [ ] Check-in photos
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
