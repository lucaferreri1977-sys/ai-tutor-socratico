import { getFirestoreDb, TUTOR_QUIZZES_COLLECTION } from '@/lib/firebase-admin';
import { StudentId, QuizTestRecord } from '@/lib/types';
import { NextRequest } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth-check';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const studentId = req.nextUrl.searchParams.get('studentId') as StudentId | null;
    const db = getFirestoreDb();

    let query: FirebaseFirestore.Query = db.collection(TUTOR_QUIZZES_COLLECTION);
    if (studentId) {
      query = query.where('studentId', '==', studentId);
    }

    const snapshot = await query.get();

    const quizzes = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          subject: data.subject,
          subjectName: data.subjectName,
          topic: data.topic,
          score: data.score,
          maxScore: data.maxScore,
          grade: data.grade,
          percentage: data.percentage,
          answers: data.answers || [],
          feedback: data.feedback || '',
          completedAt: data.completedAt,
          masteryCompleted: data.masteryCompleted || false,
          reinforcementScore: data.reinforcementScore || undefined,
        } as QuizTestRecord;
      })
      .sort((a, b) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 50);

    return new Response(JSON.stringify({ quizzes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching quizzes:', error);
    return new Response(JSON.stringify({ quizzes: [] }), { status: 200 });
  }
}

export async function POST(req: Request) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const body = (await req.json()) as QuizTestRecord;
    const { studentId, studentName, subject, subjectName, topic, score, maxScore, grade, percentage, answers, feedback } = body;

    const db = getFirestoreDb();
    const now = new Date().toISOString();
    const quizId = body.id || `quiz-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const quizRef = db.collection(TUTOR_QUIZZES_COLLECTION).doc(quizId);

    const quizData = {
      id: quizId,
      studentId,
      studentName: studentName || (studentId === 'alessio' ? 'Alessio' : 'Mattia'),
      subject,
      subjectName,
      topic: topic || 'Argomento generale',
      score: score || 0,
      maxScore: maxScore || 5,
      grade: grade || Math.round(((score || 0) / (maxScore || 5)) * 10),
      percentage: percentage || Math.round(((score || 0) / (maxScore || 5)) * 100),
      answers: answers || [],
      feedback: feedback || '',
      completedAt: body.completedAt || now,
      masteryCompleted: !!body.masteryCompleted,
      reinforcementScore: body.reinforcementScore || null,
    };

    await quizRef.set(quizData, { merge: true });

    return new Response(JSON.stringify({ success: true, id: quizId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error saving quiz result:', error);
    const msg = error instanceof Error ? error.message : 'Errore nel salvataggio del quiz';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const { id, masteryCompleted, reinforcementScore } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID del quiz mancante' }), { status: 400 });
    }

    const db = getFirestoreDb();
    const quizRef = db.collection(TUTOR_QUIZZES_COLLECTION).doc(id);
    await quizRef.set(
      {
        masteryCompleted: !!masteryCompleted,
        reinforcementScore: reinforcementScore || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error updating quiz mastery:', error);
    const msg = error instanceof Error ? error.message : 'Errore nell\'aggiornamento del quiz';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
