export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { pin } = (await req.json()) as { pin: string };
    const expectedPin = process.env.FAMILY_PIN || '240813';

    if (!pin || pin.trim() !== expectedPin.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PIN non corretto. Chiedi a papà o mamma il codice di famiglia!',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Errore durante la verifica del PIN.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
