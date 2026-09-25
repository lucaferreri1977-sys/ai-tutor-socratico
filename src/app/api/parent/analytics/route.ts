import { getFirestoreDb, TUTOR_SESSIONS_COLLECTION } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

import { isParentAuthorized } from '@/lib/auth-check';

export async function GET(req: Request) {
  if (!isParentAuthorized(req)) {
    return new Response(
      JSON.stringify({ error: 'Accesso riservato: inserisci il PIN Genitori corretto per visualizzare le statistiche.' }),
      { status: 401 }
    );
  }

  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection(TUTOR_SESSIONS_COLLECTION).orderBy('updatedAt', 'desc').get();

    const stats = {
      alessio: {
        totalSessions: 0,
        totalMessages: 0,
        subjects: {} as Record<string, number>,
      },
      mattia: {
        totalSessions: 0,
        totalMessages: 0,
        subjects: {} as Record<string, number>,
      },
      allSessions: [] as any[],
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const student = data.studentId === 'mattia' ? 'mattia' : 'alessio';
      const msgCount = Array.isArray(data.messages) ? data.messages.length : 0;
      const subj = data.subject || 'matematica';

      stats[student].totalSessions += 1;
      stats[student].totalMessages += msgCount;
      stats[student].subjects[subj] = (stats[student].subjects[subj] || 0) + 1;

      stats.allSessions.push({
        id: doc.id,
        studentId: student,
        studentName: student === 'alessio' ? 'Alessio' : 'Mattia',
        subject: subj,
        title: data.title || 'Sessione di studio',
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        messageCount: msgCount,
      });
    });

    return new Response(JSON.stringify({ stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error computing analytics:', error);
    return new Response(JSON.stringify({ error: 'Errore nel calcolo delle statistiche' }), { status: 500 });
  }
}
