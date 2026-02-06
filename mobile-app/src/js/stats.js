document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
});

async function fetchStats() {
    try {
        const response = await fetch('/api/stats/user');

        if (response.status === 401) {
            window.location.href = '/';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        renderStats(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading').textContent = 'Failed to load stats. Please try again later.';
    }
}

function renderStats(data) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsData').style.display = 'grid';

    // 1. Total Check-ins
    document.getElementById('totalCheckins').textContent = data.total_checkins;

    // 2. Favorite Places
    const favoritesContainer = document.getElementById('favoritePlaces');
    favoritesContainer.innerHTML = '';

    if (data.favorite_places.length === 0) {
        favoritesContainer.innerHTML = '<div class="empty-message">No favorite places yet!</div>';
    } else {
        data.favorite_places.forEach((place, index) => {
            const placeItem = document.createElement('div');
            placeItem.className = 'place-item';

            // Rank colors
            let rankColor = '#b5b5b5'; // Default gray
            if (index === 0) rankColor = '#FFD700'; // Gold
            if (index === 1) rankColor = '#C0C0C0'; // Silver
            if (index === 2) rankColor = '#CD7F32'; // Bronze

            placeItem.innerHTML = `
                <div class="place-info">
                    <div class="place-rank" style="background: ${rankColor}; color: ${index === 0 ? '#3d3d3d' : 'white'}">${index + 1}</div>
                    <div class="place-name">${escapeHtml(place.location_name)}</div>
                </div>
                <div class="place-count">${place.count} check-ins</div>
            `;
            favoritesContainer.appendChild(placeItem);
        });
    }

    // 3. Community Top Spot
    const communityContainer = document.getElementById('communityTopSpot');
    communityContainer.innerHTML = '';

    if (data.community_top_place) {
        communityContainer.innerHTML = `
            <div class="top-spot-badge">Most Popular Overall</div>
            <div class="top-spot-name">${escapeHtml(data.community_top_place.location_name)}</div>
            <p style="color: var(--text-secondary);">${data.community_top_place.count} total check-ins by everyone</p>
        `;
    } else {
        communityContainer.innerHTML = '<div class="empty-message">Not enough data yet!</div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
