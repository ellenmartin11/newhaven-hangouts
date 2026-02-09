# 🎯 New Haven HangOut

A mobile-first location-based social application where users can check in to locations in New Haven, CT and see where their friends are hanging out. I am an independent developer, and this app is entirely non-profit. 

## Docs
- Privacy Policy: [Privacy Policy](https://ellenmartin11.github.io/newhaven-hangouts/privacy-policy.html)
- Terms of Service: [Terms of Service](https://ellenmartin11.github.io/newhaven-hangouts/terms-of-service.html)
- Product Roadmap: [Product Roadmap](https://ellenmartin11.github.io/newhaven-hangouts/HangOut-2025-roadmap.html)


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
- **IOS and Android** In beta testing for Android and iOS devices

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


## 📊 Database Schema

- **users**: User accounts with username, email, and password hash
- **friendships**: Friend relationships with status (pending/accepted/rejected)
- **checkins**: Location check-ins with PostGIS geometry and expiration time
- **attendees**: Tracks who's coming to each check-in


## 🚧 Future Enhancements

- [ ] Push notifications via FCM
- [ ] Check-in photos
- [ ] Email verification
- [ ] Activity feed/timeline
- [ ] User profiles

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for the New Haven community
