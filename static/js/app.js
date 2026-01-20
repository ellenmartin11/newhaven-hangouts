// New Haven Hangouts - Frontend Application Logic

let map;
let userId = null;
let username = null;
let currentLocation = null;
let markers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Theme
    initTheme();

    // Check if user is logged in (session-based)
    try {
        const response = await fetch('/api/current_user');
        if (response.ok) {
            const data = await response.json();
            userId = data.user_id;
            username = data.username;
            updateUserInterface(username);
            document.getElementById('loginModal').style.display = 'none';
            initMap();
        } else {
            document.getElementById('loginModal').style.display = 'flex';
        }
    } catch (error) {
        document.getElementById('loginModal').style.display = 'flex';
    }
});

// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'glacier';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'glacier';
    const next = current === 'glacier' ? 'default' : 'glacier';

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
        const response = await fetch('/api/auth/reset-password-request', {
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
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

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
        console.error('Login error:', error);
        messageEl.innerHTML = '<span class="error">Login failed. Please try again.</span>';
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
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
        await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Reset variables
    userId = null;
    username = null;

    // Reload the page to show login modal
    window.location.reload();
}


// Initialize Leaflet map
function initMap() {
    // Create map centered on New Haven, CT
    const mapElement = document.getElementById('map');
    if (!mapElement) return; // Exit if map element doesn't exist (e.g. on other pages)

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
        const response = await fetch(`/api/feed?user_id=${userId}`);
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
    const mapView = document.getElementById('mapView');
    const listView = document.getElementById('listView');
    const mapBtn = document.getElementById('mapViewBtn');
    const listBtn = document.getElementById('listViewBtn');

    if (view === 'map') {
        mapView.style.display = 'block';
        listView.style.display = 'none';
        mapBtn.classList.add('active');
        listBtn.classList.remove('active');

        // Refresh map size
        if (map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    } else {
        mapView.style.display = 'none';
        listView.style.display = 'block';
        mapBtn.classList.remove('active');
        listBtn.classList.add('active');
    }
}

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
        const response = await fetch('/api/friends');
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
        const response = await fetch('/api/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

    if (!query || query.length < 3) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            // Search around New Haven, CT
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&` +
                `format=json&` +
                `limit=5&` +
                `viewbox=-72.98,41.36,-72.87,41.25&` + // New Haven bounding box
                `bounded=1`
            );

            const results = await response.json();

            if (results.length > 0) {
                searchResults.innerHTML = results.map(result => `
                    <div class="search-result-item" onclick="selectLocation('${result.display_name}', ${result.lat}, ${result.lon})">
                        <div class="result-name">${result.display_name.split(',')[0]}</div>
                        <div class="result-address">${result.display_name}</div>
                    </div>
                `).join('');
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<div class="no-results">No results found</div>';
                searchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300); // Debounce delay
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

// Use current GPS location
function useCurrentLocation() {
    if (!currentLocation) {
        alert('Getting your location...');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentLocationAsCheckin();
                },
                function (error) {
                    alert('Could not get your location. Please search for a place instead.');
                }
            );
        }
    } else {
        setCurrentLocationAsCheckin();
    }
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
async function imComing(checkinId) {
    try {
        const response = await fetch('/api/coming', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
async function deleteCheckin(checkinId) {
    if (!confirm('Are you sure you want to delete this check-in?')) {
        return;
    }

    try {
        const response = await fetch(`/api/checkin/${checkinId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
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
