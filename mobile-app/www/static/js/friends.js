/**
 * Friends Page JavaScript
 * Handles friend requests and friend list management
 */

// For Production (Vercel)
const API_BASE_URL = 'https://newhaven-hangouts.vercel.app';

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadFriendRequests();
    await loadFriends();
});

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/current_user`, { credentials: 'include' });
        if (!response.ok) {
            // Not authenticated, redirect to home
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();
        document.getElementById('usernameDisplay').textContent = data.username;
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'index.html';
    }
}

async function addFriend() {
    const emailInput = document.getElementById('friendEmailInput');
    const email = emailInput.value.trim();
    const messageContainer = document.getElementById('addFriendMessage');

    if (!email) {
        showMessage(messageContainer, 'Please enter an email address', 'error');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage(messageContainer, 'Please enter a valid email address', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ friend_email: email })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageContainer, data.message, 'success');
            emailInput.value = '';
            // Reload friends list in case it was an auto-accept
            await loadFriends();
        } else {
            showMessage(messageContainer, data.error || 'Failed to send friend request', 'error');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        showMessage(messageContainer, 'Failed to send friend request', 'error');
    }
}

async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/requests`, { credentials: 'include' });

        if (!response.ok) {
            console.error('Failed to load friend requests');
            return;
        }

        const data = await response.json();
        const requests = data.requests || [];

        const requestsContainer = document.getElementById('friendRequests');
        const badge = document.getElementById('requestsBadge');

        badge.textContent = requests.length;

        if (requests.length === 0) {
            requestsContainer.innerHTML = '<p class="empty-state">No pending friend requests</p>';
            return;
        }

        requestsContainer.innerHTML = requests.map(request => `
            <div class="friend-request-card" data-user-id="${request.user_id}">
                <div class="friend-info">
                    <div class="friend-avatar">${request.username.charAt(0).toUpperCase()}</div>
                    <div class="friend-details">
                        <div class="friend-name">${escapeHtml(request.username)}</div>
                        <div class="friend-email">${escapeHtml(request.email)}</div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-success" onclick="acceptRequest('${request.user_id}')">Accept</button>
                    <button class="btn btn-danger" onclick="rejectRequest('${request.user_id}')">Reject</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

async function acceptRequest(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });

        if (response.ok) {
            // Reload both lists
            await loadFriendRequests();
            await loadFriends();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to accept friend request');
        }
    } catch (error) {
        console.error('Error accepting request:', error);
        alert('Failed to accept friend request');
    }
}

async function rejectRequest(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });

        if (response.ok) {
            // Reload requests list
            await loadFriendRequests();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to reject friend request');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject friend request');
    }
}

async function loadFriends() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/friends`, { credentials: 'include' });

        if (!response.ok) {
            console.error('Failed to load friends');
            return;
        }

        const data = await response.json();
        const friends = data.friends || [];

        const friendsContainer = document.getElementById('friendsList');
        const badge = document.getElementById('friendsBadge');

        badge.textContent = friends.length;

        if (friends.length === 0) {
            friendsContainer.innerHTML = '<p class="empty-state">No friends yet. Add some friends to get started!</p>';
            return;
        }

        friendsContainer.innerHTML = friends.map(friend => `
            <div class="friend-card">
                <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
                <div class="friend-details">
                    <div class="friend-name">${escapeHtml(friend.username)}</div>
                    <div class="friend-email">${escapeHtml(friend.email)}</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = 'index.html';
    }
}

function showMessage(container, message, type) {
    container.innerHTML = `<div class="message ${type}">${escapeHtml(message)}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
