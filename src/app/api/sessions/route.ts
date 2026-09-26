import { getFirestoreDb, TUTOR_SESSIONS_COLLECTION } from '@/lib/firebase-admin';
import { StudentId, SubjectId } from '@/lib/types';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

import { getAuthorizedUser } from '@/lib/auth-check';

export async function GET(req: NextRequest) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const studentId = req.nextUrl.searchParams.get('studentId') as StudentId | null;
    const db = getFirestoreDb();

    let query: FirebaseFirestore.Query = db.collection(TUTOR_SESSIONS_COLLECTION);
    if (studentId) {
      query = query.where('studentId', '==', studentId);
    }

    const snapshot = await query.get();

    const sessions = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          subject: data.subject,
          title: data.title || 'Conversazione con Socrate',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
        };
      })
      .sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 50);

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
  const user = getAuthorizedUser(req);
  if (!user) {
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

    const sessionData: Record<string, any> = {
      studentId,
      studentName: studentName || (studentId === 'alessio' ? 'Alessio' : 'Mattia'),
      subject: subject || 'Generale',
      title: derivedTitle || 'Conversazione con Socrate',
      messages: messages || [],
      updatedAt: now,
    };
    if (!id) {
      sessionData.createdAt = now;
    }

    await sessionRef.set(sessionData, { merge: true });

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
