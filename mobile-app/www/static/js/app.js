// New Haven Hangouts - Frontend Application Logic

let map;
let userId = null;
let username = null;
let currentLocation = null;
let markers = [];

// API Base URL - Change this to your deployed server URL when publishing
// API Base URL - Change this to your deployed server URL when publishing
// For Production (Vercel)
const API_BASE_URL = 'https://newhaven-hangouts.vercel.app';
// For Local Dev / Simulator
// const API_BASE_URL = 'http://192.168.68.109:8000';

// Initialize the application
document.addEventListener('DOMContentLoaded', async function () {
    // Check if onboarding is needed
    const onboardingSeen = localStorage.getItem('onboarding_seen');
    if (!onboardingSeen) {
        // Landing page handles its own display
        console.log('Onboarding needed');
    }

    // Initialize Theme
    initTheme();

    // Check if user is logged in (session-based)
    try {
        const response = await fetch(`${API_BASE_URL}/api/current_user`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            userId = data.user_id;
            username = data.username;
            updateUserInterface(username); // New helper to update UI text
            document.getElementById('loginModal').style.display = 'none';
            initMap();
        } else {
            // No active session. Check for saved credentials for auto-login
            const savedEmail = localStorage.getItem('rememberedEmail');
            const savedPassword = localStorage.getItem('rememberedPassword');

            if (savedEmail && savedPassword) {
                console.log('Attempting auto-login with saved credentials...');
                // Briefly show a loading state if possible
                const messageEl = document.getElementById('authMessage');
                if (messageEl) messageEl.innerHTML = '<span style="color: var(--text-secondary);">Logging you back in...</span>';

                // We use the normal performLogin logic but with saved values
                await autoLogin(savedEmail, savedPassword);
            } else {
                document.getElementById('loginModal').style.display = 'flex';
            }
        }
    } catch (error) {
        document.getElementById('loginModal').style.display = 'flex';
    }
});

// Helper for auto-login to avoid infinite recursion or complex state
async function autoLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, remember: true })
        });

        if (response.ok) {
            const data = await response.json();
            userId = data.user_id;
            username = data.username;
            updateUserInterface(username);
            document.getElementById('loginModal').style.display = 'none';
            initMap();
        } else {
            // Auto-login failed (maybe password changed)
            localStorage.removeItem('rememberedPassword');
            document.getElementById('loginModal').style.display = 'flex';
        }
    } catch (error) {
        document.getElementById('loginModal').style.display = 'flex';
    }
}


// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'default';
    const next = current === 'default' ? 'glacier' : 'default';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = theme === 'default' ? '🏔️ Glacier Mode' : '☀️ Default Mode';
    }
}

// Helper to update username in multiple places if needed
function updateUserInterface(name) {
    const display = document.getElementById('usernameDisplay');
    if (display) display.textContent = name;
}

// FAB Menu Logic
function toggleFabMenu() {
    const fabMenu = document.getElementById('fabMenu');
    fabMenu.classList.toggle('active');

    // Animate FAB icon if desired (e.g. rotate)
    const fabBtn = document.querySelector('.fab-main');
    fabBtn.classList.toggle('active');
}

// Close FAB menu when clicking outside
document.addEventListener('click', function (event) {
    const fabContainer = document.querySelector('.fab-container');
    const fabMenu = document.getElementById('fabMenu');

    if (fabContainer && !fabContainer.contains(event.target) && fabMenu.classList.contains('active')) {
        toggleFabMenu();
    }
});

// Switch between login and signup
function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const authMessage = document.getElementById('authMessage');

    authMessage.innerHTML = '';

    if (mode === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

// Global helper for landing page to open signup modal
window.openSignupModal = function () {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        switchAuthMode('signup');
    }
}

function togglePasswordVisibility(inputId, toggleBtn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = '<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'; // eye (now visible)
    } else {
        input.type = 'password';
        toggleBtn.innerHTML = '<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'; // eye-off (now concealed)
    }
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.getElementById('authMessage').innerHTML = '';
}

async function requestPasswordReset() {
    const email = document.getElementById('forgotEmail').value.trim();
    const messageEl = document.getElementById('authMessage');

    if (!email) {
        messageEl.innerHTML = '<span class="error">Please enter your email</span>';
        return;
    }

    messageEl.innerHTML = '<span style="color: var(--text-secondary);">Sending...</span>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            messageEl.innerHTML = `<span style="color: green;">${data.message}</span>`;
        } else {
            messageEl.innerHTML = `<span class="error">${data.error}</span>`;
        }
    } catch (error) {
        messageEl.innerHTML = '<span class="error">Request failed. Try again.</span>';
    }
}

// Perform login
async function performLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('authMessage');

    if (!email || !password) {
        messageEl.innerHTML = '<span class="error">Please enter email and password</span>';
        return;
    }

    try {
        const rememberMe = document.getElementById('rememberMe').checked;
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, remember: rememberMe })
        });

        console.log('Login Response Status:', response.status);
        const text = await response.text();
        console.log('Login Response Text:', text);
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }

        if (response.ok) {
            userId = data.user_id;
            username = data.username;

            // Update UI
            updateUserInterface(username);
            document.getElementById('loginModal').style.display = 'none';

            // Save credentials if Remember Me is checked
            const rememberMe = document.getElementById('rememberMe').checked;
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            // Initialize map
            initMap();
        } else {
            console.error('Login failed response:', data);
            alert('Login Failed: ' + (data.error || 'Unknown error'));
            messageEl.innerHTML = `<span class="error">${data.error}</span>`;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login Network Error: ' + error.message);
        messageEl.innerHTML = '<span class="error">Login failed: ' + error.message + '</span>';
    }
}

// Perform signup
async function performSignup() {
    const signupUsername = document.getElementById('signupUsername').value.trim();
    const signupEmail = document.getElementById('signupEmail').value.trim();
    const signupPassword = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const messageEl = document.getElementById('authMessage');

    if (!signupUsername || !signupEmail || !signupPassword || !confirmPassword) {
        messageEl.innerHTML = '<span class="error">Please fill in all fields</span>';
        return;
    }

    if (signupPassword !== confirmPassword) {
        messageEl.innerHTML = '<span class="error">Passwords do not match</span>';
        return;
    }

    if (signupPassword.length < 6) {
        messageEl.innerHTML = '<span class="error">Password must be at least 6 characters</span>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username: signupUsername,
                email: signupEmail,
                password: signupPassword
            })
        });

        const data = await response.json();

        // Check for successful response (200-299 status codes)
        if (response.ok) {
            userId = data.user_id;
            username = data.username;

            // Update UI
            updateUserInterface(username);
            document.getElementById('loginModal').style.display = 'none';

            // Initialize map
            initMap();
        } else {
            messageEl.innerHTML = `<span class="error">${data.error}</span>`;
        }
    } catch (error) {
        console.error('Signup error:', error);
        messageEl.innerHTML = '<span class="error">Signup failed. Please try again.</span>';
    }
}

// Logout function
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Reset variables
    userId = null;
    username = null;

    // Clear saved credentials
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');

    // Reload the page to show login modal
    window.location.reload();
}

// Delete Account Function
async function deleteAccount() {
    const confirmed = confirm("WARNING: This will permanently delete your account and all your check-in history. This action cannot be undone.\n\nAre you absolutely sure?");

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/delete`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert("Your account has been deleted. Goodbye! 👋");

            // Clear credentials
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');

            // Return to login
            window.location.reload();
        } else {
            const data = await response.json();
            alert("Deletion failed: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error('Delete account error:', error);
        alert("Failed to delete account. Please try again.");
    }
}



// Initialize Leaflet map
function initMap() {
    // Create map centered on New Haven, CT
    map = L.map('map').setView([41.308, -72.927], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Add a marker for user's location
                L.marker([currentLocation.lat, currentLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="background: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                        iconSize: [22, 22],
                        iconAnchor: [11, 11]
                    })
                }).addTo(map).bindPopup('You are here');

                // Center map on user's location
                map.setView([currentLocation.lat, currentLocation.lng], 15);
            },
            function (error) {
                console.error('Geolocation error:', error);
            }
        );
    }

    // Load check-ins
    loadFeed();
}

// Load check-ins feed
async function loadFeed() {
    if (!userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/feed?user_id=${userId}`, { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
            // Clear existing markers
            markers.forEach(marker => marker.remove());
            markers = [];

            // Add markers for each check-in
            data.checkins.forEach(checkin => {
                addCheckinMarker(checkin);
            });

            // Update list view
            updateListView(data.checkins);
        } else {
            console.error('Feed error:', data.error);
        }
    } catch (error) {
        console.error('Load feed error:', error);
    }
}

// Update list view with check-ins
function updateListView(checkins) {
    const listContainer = document.getElementById('checkinsList');

    if (!checkins || checkins.length === 0) {
        listContainer.innerHTML = '<p class="no-checkins">No active check-ins from friends 😔</p>';
        return;
    }

    listContainer.innerHTML = checkins.map(checkin => {
        const time = new Date(checkin.created_at);
        const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const isOwn = checkin.user_id === userId;

        // Format attendees list
        let attendeesHtml = '';
        if (checkin.attendees && checkin.attendees.length > 0) {
            const attendeeNames = checkin.attendees.map(a => a.username).join(', ');
            const attendeeCount = checkin.attendees.length;
            attendeesHtml = `
                <div class="attendees-list">
                    <span class="attendees-icon">👥</span>
                    <span class="attendees-text">${attendeeCount} coming: ${attendeeNames}</span>
                </div>
            `;
        }

        return `
            <div class="checkin-card ${isOwn ? 'own-checkin' : ''}">
                <div class="checkin-header">
                    <span class="checkin-user">${checkin.username}</span>
                    <div class="checkin-meta">
                        <span class="checkin-time">updated ${formatTime(checkin.created_at)}</span>
                        <span class="checkin-duration">⏱️ ${formatRemainingTime(checkin.expires_at)}</span>
                    </div>
                </div>
                <div class="checkin-location">
                    📍 ${checkin.location_name}
                </div>
                ${checkin.message ? `<div class="checkin-message">${checkin.message}</div>` : ''}
                ${attendeesHtml}
                ${!isOwn ? `
                    <button class="btn btn-coming-small" onclick="imComing('${checkin.id}')">
                        I'm Coming! 🎉
                    </button>
                ` : `
                    <button class="btn btn-delete-small" onclick="deleteCheckin('${checkin.id}')">
                        🗑️ Delete Check-in
                    </button>
                `}
            </div>
        `;
    }).join('');
}

// Switch between map and list views
function switchView(view) {
    console.log('switchView called with:', view);
    // Use an alert to verify it's working on the emulator
    // alert('Switching to: ' + view); 

    const mapView = document.getElementById('mapView');
    const listView = document.getElementById('listView');
    const mapBtn = document.getElementById('mapViewBtn');
    const listBtn = document.getElementById('listViewBtn');

    if (!mapView || !listView || !mapBtn || !listBtn) {
        console.error('View elements missing');
        return;
    }

    if (view === 'map') {
        mapView.style.display = 'block';
        listView.style.display = 'none';
        mapBtn.classList.add('active');
        listBtn.classList.remove('active');

        if (map) {
            setTimeout(() => map.invalidateSize(), 150);
        }
    } else {
        mapView.style.display = 'none';
        listView.style.display = 'block';
        mapBtn.classList.remove('active');
        listBtn.classList.add('active');

        if (userId) {
            loadFeed();
        }
    }
}

// Add touch listeners for faster response on mobile emulators
document.addEventListener('DOMContentLoaded', () => {
    const mapBtn = document.getElementById('mapViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    if (mapBtn) mapBtn.addEventListener('touchstart', (e) => { e.preventDefault(); switchView('map'); });
    if (listBtn) listBtn.addEventListener('touchstart', (e) => { e.preventDefault(); switchView('list'); });
});

// Add a check-in marker to the map
function addCheckinMarker(checkin) {
    const marker = L.marker([checkin.lat, checkin.lng], {
        icon: L.divIcon({
            className: 'checkin-marker',
            html: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        })
    }).addTo(map);

    // Format attendees for popup
    let attendeesHtml = '';
    if (checkin.attendees && checkin.attendees.length > 0) {
        const attendeeNames = checkin.attendees.map(a => a.username).join(', ');
        attendeesHtml = `<p class="attendees"><strong>👥 ${checkin.attendees.length} coming:</strong> ${attendeeNames}</p>`;
    }

    // Create popup content
    const popupContent = `
        <div class="checkin-popup">
            <h4>${checkin.username}</h4>
            <p class="location"><strong>📍 ${checkin.location_name}</strong></p>
            ${checkin.message ? `<p class="message">${checkin.message}</p>` : ''}
            ${attendeesHtml}
            <p class="time">Posted ${formatTime(checkin.created_at)} • ⏱️ ${formatRemainingTime(checkin.expires_at)}</p>
            ${checkin.user_id !== userId ?
            `<button class="btn btn-coming" onclick="imComing('${checkin.id}')">I'm Coming! 🎉</button>`
            : `<button class="btn btn-delete" onclick="deleteCheckin('${checkin.id}')">🗑️ Delete Check-in</button>`}
        </div>
    `;

    marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'custom-popup'
    });

    markers.push(marker);
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
}

// Format remaining time until expiration
function formatRemainingTime(expiresAt) {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate - now;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m left`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours < 24) {
        if (remainingMins > 0) {
            return `${diffHours}h ${remainingMins}m left`;
        }
        return `${diffHours}h left`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d left`;
}

// Show check-in form
function showCheckinForm() {
    document.getElementById('checkinForm').style.display = 'block';

    // Load friends for selection if not already loaded
    if (document.getElementById('friendsCheckboxes').children.length <= 1) {
        loadFriendsForSelection();
    }

    // Try to get current location in background (optional now)
    if (!currentLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            function (error) {
                console.log('Location not available, user can search instead');
            }
        );
    }
}

let cachedFriends = [];

async function loadFriendsForSelection() {
    const container = document.getElementById('friendsCheckboxes');
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends`, { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
            cachedFriends = data.friends;
            if (cachedFriends.length === 0) {
                container.innerHTML = '<p class="no-checkins">You have no friends yet to share with!</p>';
                return;
            }

            container.innerHTML = cachedFriends.map(friend => `
                    <label class="friend-checkbox-item">
                        <input type="checkbox" 
                               name="friend_share" 
                               value="${friend.user_id}" 
                               class="friend-check">
                        <span class="friend-name-text">${friend.username}</span>
                    </label>
                `).join('');
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to load friends.</p>';
    }
}

function toggleFriendList(show) {
    const list = document.getElementById('friendSelectionList');
    list.style.display = show ? 'block' : 'none';
}

function toggleSelectAllFriends(source) {
    const checkboxes = document.querySelectorAll('.friend-check');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

// Hide check-in form
function hideCheckinForm() {
    document.getElementById('checkinForm').style.display = 'none';
    document.getElementById('locationSearch').value = '';
    document.getElementById('locationName').value = '';
    document.getElementById('selectedLat').value = '';
    document.getElementById('selectedLng').value = '';
    document.getElementById('message').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').style.display = 'none';
}

// Submit check-in
async function submitCheckin() {
    const locationName = document.getElementById('locationName').value.trim();
    const message = document.getElementById('message').value.trim();
    const duration = parseInt(document.getElementById('duration').value);
    const selectedLat = document.getElementById('selectedLat').value;
    const selectedLng = document.getElementById('selectedLng').value;

    // Visibility
    const visibilityRoute = document.querySelector('input[name="visibility"]:checked');
    const visibility = visibilityRoute ? visibilityRoute.value : 'everyone';
    let shareWith = [];

    if (visibility === 'specific') {
        const checkboxes = document.querySelectorAll('.friend-check:checked');
        checkboxes.forEach(cb => shareWith.push(cb.value));

        if (shareWith.length === 0) {
            alert('Please select at least one friend to share with, or choose "Everyone".');
            return;
        }
    }

    if (!locationName) {
        alert('Please search for a location or use your current location');
        return;
    }

    if (!selectedLat || !selectedLng) {
        alert('Please select a location first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                user_id: userId,
                lat: parseFloat(selectedLat),
                lng: parseFloat(selectedLng),
                location_name: locationName,
                message: message,
                duration_minutes: duration,
                visibility: visibility,
                share_with: shareWith
            })
        });

        const data = await response.json();

        if (response.ok) {
            hideCheckinForm();
            loadFeed();
            alert('Check-in posted! 🎉');
        } else {
            alert('Check-in failed: ' + data.error);
        }
    } catch (error) {
        console.error('Check-in error:', error);
        alert('Check-in failed. Please try again.');
    }
}

// Search for location using Nominatim (OpenStreetMap)
let searchTimeout;
async function searchLocation(query) {
    clearTimeout(searchTimeout);

    const searchResults = document.getElementById('searchResults');

    if (!query || query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }

    // Show loading state
    searchResults.innerHTML = '<div class="searching">🔍 Searching...</div>';
    searchResults.style.display = 'block';

    searchTimeout = setTimeout(async () => {
        try {
            console.log('Searching OSM for:', query);
            // Connecticut Bounds
            // viewbox=left,top,right,bottom
            // Approx: -73.77 (Greenwich), 42.05 (MA border), -71.79 (RI border), 40.98 (Sound)
            // Using slightly wider box to be safe: -74.0,42.1,-71.5,40.9
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&` +
                `format=json&` +
                `addressdetails=1&` +
                `limit=5&` +
                `countrycodes=us&` +
                `viewbox=-73.8,42.1,-71.7,40.9&` +
                `bounded=1`
            );

            if (!response.ok) {
                throw new Error(`OSM error: ${response.status}`);
            }

            const results = await response.json();
            console.log('OSM Results:', results);

            if (results && results.length > 0) {
                searchResults.innerHTML = results.map(result => {
                    const escapedName = result.display_name.replace(/'/g, "\\'");
                    const mainName = result.display_name.split(',')[0];
                    return `
                        <div class="search-result-item" onclick="selectLocation('${escapedName}', ${result.lat}, ${result.lon})">
                            <div class="result-name">${mainName}</div>
                            <div class="result-address">${result.display_name}</div>
                        </div>
                    `;
                }).join('');
            } else {
                searchResults.innerHTML = '<div class="no-results">No results found in this area. Try adding "New Haven" to your search.</div>';
            }
            searchResults.style.display = 'block';
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="no-results">❌ Search failed. Please check your connection.</div>';
        }
    }, 400); // Slightly longer debounce for reliability
}

// Select a location from search results
function selectLocation(name, lat, lng) {
    document.getElementById('locationName').value = name.split(',')[0];
    document.getElementById('selectedLat').value = lat;
    document.getElementById('selectedLng').value = lng;
    document.getElementById('locationSearch').value = name.split(',')[0];
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').style.display = 'none';
}

// Use Current Location Function
function useCurrentLocation() {
    console.log('useCurrentLocation triggered');
    // Check if disclosure has been accepted (using localStorage for persistence)
    if (!localStorage.getItem('locationDisclosureAccepted')) {
        console.log('Showing disclosure modal');
        document.getElementById('locationDisclosureModal').style.display = 'flex';
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    const btn = document.getElementById('useCurrentLocationBtn');
    const originalText = btn ? btn.innerHTML : '📍 Use My Current Location';
    if (btn) {
        btn.innerHTML = '📍 Finding you...';
        btn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            await setCurrentLocationAsCheckin();
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        },
        (error) => {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            console.error('GPS error:', error);
            alert('Could not get your location. Please search for a place instead.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function acceptLocationDisclosure() {
    console.log('Disclosure accepted');
    localStorage.setItem('locationDisclosureAccepted', 'true');
    closeLocationDisclosure();
    useCurrentLocation(); // Retry
}

function closeLocationDisclosure() {
    document.getElementById('locationDisclosureModal').style.display = 'none';
}

// Set current location in the form
async function setCurrentLocationAsCheckin() {
    document.getElementById('selectedLat').value = currentLocation.lat;
    document.getElementById('selectedLng').value = currentLocation.lng;

    // Reverse geocode to get location name
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `lat=${currentLocation.lat}&` +
            `lon=${currentLocation.lng}&` +
            `format=json`
        );

        const data = await response.json();
        const locationName = data.address.shop ||
            data.address.amenity ||
            data.address.building ||
            data.address.road ||
            'Current Location';

        document.getElementById('locationName').value = locationName;
        document.getElementById('locationSearch').value = locationName;
    } catch (error) {
        document.getElementById('locationName').value = 'Current Location';
        document.getElementById('locationSearch').value = 'Current Location';
    }
}

// Mark as coming to a check-in
// Mark as coming to a check-in
async function imComing(checkinId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/coming`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                user_id: userId,
                checkin_id: checkinId
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Great! You've been marked as coming! 🎉");
            loadFeed(); // Refresh to show updated attendees
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Coming error:', error);
        alert('Failed to mark as coming. Please try again.');
    }
}

// Delete a check-in
// Delete a check-in
async function deleteCheckin(checkinId) {
    if (!confirm('Are you sure you want to delete this check-in?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/checkin/${checkinId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                user_id: userId
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Check-in deleted! 👋');
            loadFeed(); // Refresh the feed
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete check-in. Please try again.');
    }
}
