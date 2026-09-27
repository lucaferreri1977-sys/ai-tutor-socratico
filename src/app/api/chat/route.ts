import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { buildSocraticSystemPrompt } from '@/lib/socratic-prompts';
import { SubjectId } from '@/lib/types';
import { getAuthorizedUser } from '@/lib/auth-check';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ClientMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const { messages, subject = 'matematica', studentName } = rawBody as {
      messages: ClientMessage[];
      subject: SubjectId;
      studentName?: string;
    };

    // 1. Verifica autenticazione (Alessio, Mattia o Genitori)
    const user = getAuthorizedUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'Accesso protetto: devi effettuare il login con la tua password per utilizzare Socrate.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verifica Chiave API Gemini
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Chiave API Google Gemini non trovata! Aggiungi GOOGLE_GENERATIVE_AI_API_KEY nelle impostazioni del server.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const effectiveStudentName = studentName || user.name;
    const systemPrompt = buildSocraticSystemPrompt(subject, effectiveStudentName);

    // 3. Conversione messaggi per modello con supporto multimodale foto singole o multiple.
    // Individua l'ultimo messaggio dell'utente contenente foto per preservare il contesto visivo anche nei turni successivi.
    let lastUserMessageWithImagesIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const hasImg = (msg.imageUrls && msg.imageUrls.length > 0) || !!msg.imageUrl;
      if (msg.role === 'user' && hasImg) {
        lastUserMessageWithImagesIndex = i;
        break;
      }
    }

    const modelMessages = messages.map((msg, index) => {
      const shouldIncludeImages = index === lastUserMessageWithImagesIndex;

      const images = (msg.imageUrls && msg.imageUrls.length > 0)
        ? msg.imageUrls
        : (msg.imageUrl ? [msg.imageUrl] : []);

      if (shouldIncludeImages && images.length > 0) {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text:
                msg.content ||
                `Ho caricato ${images.length > 1 ? `${images.length} foto del mio compito o delle pagine del libro` : 'questa foto del mio compito'}. Aiutami a capire come procedere o a schematizzare per studiare.`,
            },
            ...images.map((img) => ({
              type: 'image' as const,
              image: img,
            })),
          ],
        };
      }

      return {
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      };
    });

    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.35, // disciplined pedagogical focus
      maxOutputTokens: 2048, // capiente per riassunti didattici strutturati e spiegazioni di studio complete
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Errore imprevisto durante l\'elaborazione della risposta.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
