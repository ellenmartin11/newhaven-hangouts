// New Haven Hangouts - Frontend Application Logic

let map;
let userId = null;
let username = null;
let currentLocation = null;
let markers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (storedUserId && storedUsername) {
        userId = storedUserId;
        username = storedUsername;
        document.getElementById('usernameDisplay').textContent = username;
        document.getElementById('loginModal').style.display = 'none';
        initMap();
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
});

// Login function
async function login() {
    const usernameInput = document.getElementById('usernameInput').value.trim();

    if (!usernameInput) {
        alert('Please enter a username');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: usernameInput })
        });

        const data = await response.json();

        if (response.ok) {
            userId = data.user_id;
            username = data.username;

            // Store in localStorage
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', username);

            // Update UI
            document.getElementById('usernameDisplay').textContent = username;
            document.getElementById('loginModal').style.display = 'none';

            // Initialize map
            initMap();
        } else {
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Logout function
function logout() {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');

    // Reset variables
    userId = null;
    username = null;

    // Reload the page to show login modal
    window.location.reload();
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
                duration_minutes: duration
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
