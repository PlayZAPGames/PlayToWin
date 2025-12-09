import admin from 'firebase-admin';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL_JSON)
    )
  });
}


export const getFirebaseUser = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord; // ✅ Valid UID
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
        throw new Error('Invalid social ID');
    }
    throw error; // 🔥 Some other issue
  }
};

