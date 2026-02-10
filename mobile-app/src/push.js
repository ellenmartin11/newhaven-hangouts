import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

window.setupPushNotifications = async (userId, apiBaseUrl) => {
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications not supported on web');
        return;
    }

    console.log('Initializing Push Notifications for user:', userId, 'Base URL:', apiBaseUrl);

    try {
        await PushNotifications.addListener('registration', async token => {
            console.log('Push registration success, token: ' + token.value);
            // Send token to backend
            try {
                const response = await fetch(`${apiBaseUrl}/api/fcm-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token.value,
                        user_id: userId
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Token saved:', data);
            } catch (err) {
                console.error('Error saving token:', err);
            }
        });

        await PushNotifications.addListener('registrationError', err => {
            console.error('Push registration error: ', err.error);
        });

        await PushNotifications.addListener('pushNotificationReceived', notification => {
            console.log('Push received: ', notification);
            // Optionally convert to local toast or update UI
            if (window.loadNotifications) window.loadNotifications();
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
            console.log('Push action performed: ', notification);
            // Navigate if needed
            if (notification.notification.data.url) {
                window.location.href = notification.notification.data.url;
            }
        });

        // Request permissions
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
            // 1. Create the channel FIRST (Android specific)
            if (Capacitor.getPlatform() === 'android') {
                await PushNotifications.createChannel({
                    id: 'hangouts_alerts_v2',
                    name: 'Hangouts Alerts V2',
                    importance: 5, // IMPORTANCE_HIGH (Required for banners)
                    visibility: 1, // VISIBILITY_PUBLIC
                    vibration: true,
                });
            }

            // 2. Allow banners while the app is in the FOREGROUND
            await PushNotifications.setPresentationOptions({
                presentationOptions: ['alert', 'sound', 'badge'],
            });

            // 3. Finally, register for the token
            await PushNotifications.register();

        } else {
            console.log('Push permissions denied');
        }
    } catch (e) {
        console.error('Error setting up push:', e);
    }
};
