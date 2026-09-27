import admin from 'firebase-admin';

function formatPrivateKey(key) {
  return key ? key.replace(/\\n/g, '\n') : '';
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Credenziali Firebase non trovate in env!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: formatPrivateKey(privateKey),
  }),
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const TUTOR_QUIZZES_COLLECTION = 'tutor_quizzes';

async function deleteAllQuizzes() {
  console.log(`Connessione a Firestore su progetto: ${projectId}...`);
  const snapshot = await db.collection(TUTOR_QUIZZES_COLLECTION).get();
  
  console.log(`Trovate ${snapshot.size} verifiche nella collezione "${TUTOR_QUIZZES_COLLECTION}".`);

  if (snapshot.empty) {
    console.log('Nessuna verifica presente da cancellare.');
    return;
  }

  // Stampa riepilogo documenti prima dell'eliminazione
  snapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    console.log(`[${idx + 1}] ID: ${doc.id} | Studente: ${data.studentId} (${data.studentName}) | Materia: ${data.subject} | Voto: ${data.grade}/10 | Data: ${data.completedAt}`);
  });

  const batchSize = 500;
  let batch = db.batch();
  let count = 0;
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count >= batchSize) {
      await batch.commit();
      deletedCount += count;
      console.log(`Cancellati ${deletedCount} documenti...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    deletedCount += count;
  }

  console.log(`\nOperazione completata con successo: ${deletedCount} verifiche rimosse definitivamente da Firebase Firestore.`);

  // Verifica che la collezione sia vuota
  const afterSnapshot = await db.collection(TUTOR_QUIZZES_COLLECTION).get();
  console.log(`Verifiche rimanenti nel database: ${afterSnapshot.size}`);
}

deleteAllQuizzes().catch((err) => {
  console.error('Errore durante la cancellazione:', err);
  process.exit(1);
});
