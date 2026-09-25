import * as admin from 'firebase-admin';

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Credenziali Firebase non configurate nelle variabili d\'ambiente.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formatPrivateKey(privateKey),
    }),
  });
}

export function getFirestoreDb() {
  getFirebaseAdmin();
  return admin.firestore();
}

// Collezione isolata al 100% per non intaccare altri progetti dello stesso account Firebase
export const TUTOR_SESSIONS_COLLECTION = 'tutor_sessions';
