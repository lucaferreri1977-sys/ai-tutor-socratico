import { getFirestoreDb, TUTOR_SESSIONS_COLLECTION } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

import { getAuthorizedUser } from '@/lib/auth-check';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const { id } = await params;
    const db = getFirestoreDb();
    const doc = await db.collection(TUTOR_SESSIONS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return new Response(JSON.stringify({ error: 'Sessione non trovata' }), { status: 404 });
    }

    return new Response(JSON.stringify({ session: { id: doc.id, ...doc.data() } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching session:', error);
    return new Response(JSON.stringify({ error: 'Errore nel recupero della sessione' }), { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthorizedUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
  }

  try {
    const { id } = await params;
    const db = getFirestoreDb();
    await db.collection(TUTOR_SESSIONS_COLLECTION).doc(id).delete();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error deleting session:', error);
    return new Response(JSON.stringify({ error: 'Errore nella cancellazione' }), { status: 500 });
  }
}
