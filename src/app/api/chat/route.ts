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

    // 3. Ottimizzazione consumo Token e Conversione Messaggi:
    // a) Finestra temporale (Sliding Window): manteniamo max 12 messaggi recenti per evitare crescita quadratica dei token.
    const MAX_CONTEXT_MESSAGES = 12;
    const windowedMessages = messages.length > MAX_CONTEXT_MESSAGES
      ? messages.slice(-MAX_CONTEXT_MESSAGES)
      : messages;

    // b) Smart Image Detachment: individuiamo l'ultimo messaggio con foto.
    // Le immagini visive (ad alto consumo di token) vengono trasmesse al modello SOLO se il messaggio con foto
    // è recente (entro gli ultimi 3 messaggi della finestra). Una volta che Socrate ha risposto e impostato
    // l'esercizio, il testo della conversazione descrive già il problema e non serve ri-fatturare le immagini ad ogni turno.
    let lastUserMessageWithImagesIndex = -1;
    for (let i = windowedMessages.length - 1; i >= 0; i--) {
      const msg = windowedMessages[i];
      const hasImg = (msg.imageUrls && msg.imageUrls.length > 0) || !!msg.imageUrl;
      if (msg.role === 'user' && hasImg) {
        lastUserMessageWithImagesIndex = i;
        break;
      }
    }

    const isImageFresh =
      lastUserMessageWithImagesIndex !== -1 &&
      (windowedMessages.length - 1 - lastUserMessageWithImagesIndex) <= 3;

    const modelMessages = windowedMessages.map((msg, index) => {
      const isTargetImageMessage = index === lastUserMessageWithImagesIndex;
      const images = (msg.imageUrls && msg.imageUrls.length > 0)
        ? msg.imageUrls
        : (msg.imageUrl ? [msg.imageUrl] : []);

      // Includi i payload pesanti delle immagini solo se è il messaggio target ED è fresco
      if (isTargetImageMessage && isImageFresh && images.length > 0) {
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

      // Se le immagini sono già state elaborate nei turni precedenti, usiamo solo il testo per risparmiare token
      const defaultText = images.length > 0
        ? `[Foto del compito esaminata nei turni precedenti]`
        : '';

      return {
        role: msg.role as 'user' | 'assistant',
        content: msg.content || defaultText || 'Continuiamo.',
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
