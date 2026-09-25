import { getFirestoreDb, TUTOR_SESSIONS_COLLECTION } from '@/lib/firebase-admin';
import { StudentId, SubjectId } from '@/lib/types';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function verifyPin(req: Request) {
  const expected = process.env.FAMILY_PIN || '240813';
  const provided = req.headers.get('x-family-pin');
  return provided && provided.trim() === expected.trim();
}

export async function GET(req: NextRequest) {
  if (!verifyPin(req)) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const studentId = req.nextUrl.searchParams.get('studentId') as StudentId | null;
    const db = getFirestoreDb();

    let query: FirebaseFirestore.Query = db.collection(TUTOR_SESSIONS_COLLECTION);
    if (studentId) {
      query = query.where('studentId', '==', studentId);
    }

    const snapshot = await query.orderBy('updatedAt', 'desc').limit(50).get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        subject: data.subject,
        title: data.title || 'Sessione di studio',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
      };
    });

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching sessions:', error);
    return new Response(JSON.stringify({ sessions: [] }), { status: 200 });
  }
}

export async function POST(req: Request) {
  if (!verifyPin(req)) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, studentId, studentName, subject, title, messages } = body as {
      id?: string;
      studentId: StudentId;
      studentName: string;
      subject: SubjectId;
      title?: string;
      messages: Array<{ role?: string; content?: string; [key: string]: any }>;
    };

    const db = getFirestoreDb();
    const now = new Date().toISOString();
    const sessionId = id || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const sessionRef = db.collection(TUTOR_SESSIONS_COLLECTION).doc(sessionId);

    // Derive a meaningful title if not provided
    let derivedTitle = title;
    if (!derivedTitle && Array.isArray(messages) && messages.length > 0) {
      const firstUserMsg = messages.find((m) => m?.role === 'user');
      if (firstUserMsg && firstUserMsg.content) {
        derivedTitle = firstUserMsg.content.slice(0, 45) + (firstUserMsg.content.length > 45 ? '...' : '');
      }
    }

    await sessionRef.set(
      {
        studentId,
        studentName: studentName || (studentId === 'alessio' ? 'Alessio' : 'Mattia'),
        subject,
        title: derivedTitle || 'Sessione di studio',
        messages: messages || [],
        updatedAt: now,
        createdAt: id ? undefined : now,
      },
      { merge: true }
    );

    return new Response(JSON.stringify({ success: true, id: sessionId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error saving session:', error);
    const msg = error instanceof Error ? error.message : 'Errore nel salvataggio della sessione';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
