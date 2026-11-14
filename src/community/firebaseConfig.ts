export function firebaseWebConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyC8K49hGwU_UjiSqccWa9bwr1jcjW3b5d0",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "tatelapp.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "tatelapp",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:407678119594:web:9d4a74e063f26a882dead3",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "407678119594",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "tatelapp.firebasestorage.app",
  };
}
