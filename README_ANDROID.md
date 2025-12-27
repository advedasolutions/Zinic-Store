
# Zinic Android App: Supabase Real-time Sync

This project is configured to transform the Zinic Web App into a native Android application using **Capacitor**. It relies exclusively on **Supabase** for real-time data synchronization and local notifications.

## 1. Prerequisites
- **Node.js**: v18+ 
- **Android Studio**: Latest version installed.
- **Physical Android Device**: Recommended for testing notifications (enable USB Debugging).

## 2. Real-time Architecture
Zinic does **not** use Firebase for its core notifications. Instead:
1. **Supabase Realtime (WebSockets)** listens for new orders or stock changes.
2. When a change is detected (even in the background on Android), the app's `NotificationService` triggers a **Local Notification**.
3. This ensures that a web user placing an order immediately notifies an Android manager without a complex Firebase setup.

## 3. Build Instructions

```bash
# A. Build the web assets
npm run static-build

# B. Sync to Android project
npx cap sync android

# C. Launch in Android Studio
npx cap open android
```

## 4. Android Studio Final Steps
1. Wait for Gradle to finish indexing.
2. **Permissions**: The app is pre-configured to ask for `POST_NOTIFICATIONS` permissions on Android 13+. Ensure you click **"Allow"** on the first launch.
3. **Real-time Check**: Open the web version and the android app side-by-side. Change a stock value in one; it will update in the other instantly via Supabase.

## 5. Troubleshooting Sync
- **No Notifications?**: Check if "Do Not Disturb" is on. Ensure you granted permissions.
- **Data Not Updating?**: Verify that your `supabase.ts` contains the correct project URL and Anon Key.
