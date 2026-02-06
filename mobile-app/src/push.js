import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

window.setupPushNotifications = async (userId) => {
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications not supported on web');
        return;
    }

    console.log('Initializing Push Notifications for user:', userId);

    try {
        await PushNotifications.addListener('registration', token => {
            console.log('Push registration success, token: ' + token.value);
            // Send token to backend
            fetch('/api/fcm-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token.value,
                    user_id: userId
                })
            }).then(res => res.json())
                .then(data => console.log('Token saved:', data))
                .catch(err => console.error('Error saving token:', err));
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
            await PushNotifications.register();
        } else {
            console.log('Push permissions denied');
        }

    } catch (e) {
        console.error('Error setting up push:', e);
    }
};
