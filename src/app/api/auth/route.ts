import { UserRole } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { role, password, pin } = (await req.json()) as {
      role?: UserRole;
      password?: string;
      pin?: string;
    };

    const providedPassword = (password || pin || '').trim();

    const expectedAlessio = (process.env.PASSWORD_ALESSIO || 'Alessio07!').trim();
    const expectedMattia = (process.env.PASSWORD_MATTIA || 'Mattia06!').trim();
    const expectedParent = (process.env.PARENT_PIN || '1488').trim();

    // Support direct role verification
    if (role === 'alessio') {
      if (providedPassword !== expectedAlessio) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password di Alessio non corretta. Riprova!' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'alessio', name: 'Alessio', avatar: '👦', token: `token-alessio-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (role === 'mattia') {
      if (providedPassword !== expectedMattia) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password di Mattia non corretta. Riprova!' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'mattia', name: 'Mattia', avatar: '🧒', token: `token-mattia-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (role === 'parent') {
      if (providedPassword !== expectedParent) {
        return new Response(
          JSON.stringify({ success: false, error: 'PIN Genitori non corretto. Riprova!' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'parent', name: 'Genitori', avatar: '👨‍👩‍👦', token: `token-parent-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auto-detect by password if role not explicitly given
    if (providedPassword === expectedAlessio) {
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'alessio', name: 'Alessio', avatar: '👦', token: `token-alessio-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (providedPassword === expectedMattia) {
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'mattia', name: 'Mattia', avatar: '🧒', token: `token-mattia-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (providedPassword === expectedParent) {
      return new Response(
        JSON.stringify({
          success: true,
          user: { role: 'parent', name: 'Genitori', avatar: '👨‍👩‍👦', token: `token-parent-${Date.now()}` },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Credenziali non valide.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Errore durante la verifica.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
