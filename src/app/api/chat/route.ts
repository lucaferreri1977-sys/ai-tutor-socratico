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

    // 3. Conversione messaggi per modello con supporto multimodale foto
    const modelMessages = messages.map((msg, index) => {
      const isLatestUserMessage =
        index === messages.length - 1 && msg.role === 'user';

      if (isLatestUserMessage && msg.imageUrl) {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text:
                msg.content ||
                'Ho caricato questa foto del mio compito. Aiutami a capire come procedere senza darmi la soluzione diretta.',
            },
            { type: 'image' as const, image: msg.imageUrl },
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
      maxOutputTokens: 800, // tetto massimo per risposta (impossibile consumare troppi token)
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
