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
  fileNames?: string[];
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

    // 3. Gestione della memoria didattica, visiva e finestra contestuale:
    // Individuiamo l'ultimo messaggio dell'utente che ha caricato foto nella sessione
    let activeImageMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const hasImg = (msg.imageUrls && msg.imageUrls.length > 0) || !!msg.imageUrl;
      if (msg.role === 'user' && hasImg) {
        activeImageMessageIndex = i;
        break;
      }
    }

    // Sliding Window intelligente:
    // Manteniamo fino a 14 messaggi recenti per la fluidità del dialogo.
    // FONDAMENTALE: se il messaggio con le foto del libro/compito è antecedente,
    // lo preserviamo SEMPRE come primo messaggio del contesto con la prima risposta di Socrate.
    // In questo modo Socrate non dice MAI "non c'è nessuna foto" e mantiene sempre
    // la visione completa delle pagine del libro durante tutto lo studio.
    const MAX_RECENT_MESSAGES = 14;
    let windowedMessages: ClientMessage[] = [];

    if (messages.length <= MAX_RECENT_MESSAGES) {
      windowedMessages = [...messages];
    } else {
      const recentSlice = messages.slice(-MAX_RECENT_MESSAGES);
      if (activeImageMessageIndex !== -1 && activeImageMessageIndex < messages.length - MAX_RECENT_MESSAGES) {
        const imageMsg = messages[activeImageMessageIndex];
        const nextMsg = messages[activeImageMessageIndex + 1];
        const initialPair = nextMsg && nextMsg.role === 'assistant' ? [imageMsg, nextMsg] : [imageMsg];
        const recentFiltered = recentSlice.filter(
          (m) => m.id !== imageMsg.id && (!nextMsg || m.id !== nextMsg.id)
        );
        windowedMessages = [...initialPair, ...recentFiltered];
      } else {
        windowedMessages = [...recentSlice];
      }
    }

    // Assicuriamo che la sequenza inizi sempre con un messaggio 'user' (requisito API Gemini)
    while (windowedMessages.length > 0 && windowedMessages[0].role !== 'user') {
      windowedMessages.shift();
    }

    // Fusione di messaggi consecutivi con lo stesso ruolo per garantire rigorosa alternanza user <-> assistant
    const mergedMessages: ClientMessage[] = [];
    for (const msg of windowedMessages) {
      const prev = mergedMessages[mergedMessages.length - 1];
      if (prev && prev.role === msg.role) {
        prev.content = `${prev.content}\n${msg.content}`.trim();
        const prevImgs = prev.imageUrls || (prev.imageUrl ? [prev.imageUrl] : []);
        const curImgs = msg.imageUrls || (msg.imageUrl ? [msg.imageUrl] : []);
        const combinedImgs = [...prevImgs, ...curImgs];
        if (combinedImgs.length > 0) {
          prev.imageUrls = combinedImgs;
          prev.imageUrl = combinedImgs[0];
        }
        if (prev.fileNames || msg.fileNames) {
          prev.fileNames = [...(prev.fileNames || []), ...(msg.fileNames || [])];
        }
      } else {
        mergedMessages.push({ ...msg });
      }
    }

    // Individuiamo l'indice del messaggio con allegati (foto o PDF) all'interno dei messaggi normalizzati
    let targetAttachmentMsgIndex = -1;
    for (let i = mergedMessages.length - 1; i >= 0; i--) {
      const m = mergedMessages[i];
      if (m.role === 'user' && ((m.imageUrls && m.imageUrls.length > 0) || !!m.imageUrl)) {
        targetAttachmentMsgIndex = i;
        break;
      }
    }

    const modelMessages = mergedMessages.map((msg, index) => {
      const isTargetAttachmentMessage = index === targetAttachmentMsgIndex;
      const attachments =
        msg.imageUrls && msg.imageUrls.length > 0
          ? msg.imageUrls
          : msg.imageUrl
          ? [msg.imageUrl]
          : [];

      // Alleghiamo SEMPRE gli allegati (immagini e documenti PDF) dello studio attivo al messaggio target.
      // Le immagini sono compresse client-side a 1024px (~258 token) e i PDF vengono elaborati
      // nativamente da Gemini, garantendo costi minimi e massima accuratezza didattica per tutta la sessione.
      if (isTargetAttachmentMessage && attachments.length > 0) {
        const hasPdf = attachments.some((att) => att.startsWith('data:application/pdf'));
        const defaultPromptText = hasPdf
          ? `Ho caricato ${attachments.length > 1 ? `${attachments.length} allegati (documenti PDF e/o foto delle pagine del libro)` : 'un documento PDF delle pagine del libro/compito'}. Aiutami a capire come procedere, a studiare o a schematizzare.`
          : `Ho caricato ${attachments.length > 1 ? `${attachments.length} foto del mio compito o delle pagine del libro` : 'questa foto del mio compito'}. Aiutami a capire come procedere o a schematizzare per studiare.`;

        const attachmentParts = attachments.map((att) => {
          if (att.startsWith('data:application/pdf')) {
            return {
              type: 'file' as const,
              data: att,
              mediaType: 'application/pdf' as const,
            };
          }
          return {
            type: 'image' as const,
            image: att,
          };
        });

        return {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: msg.content || defaultPromptText,
            },
            ...attachmentParts,
          ],
        };
      }

      return {
        role: msg.role as 'user' | 'assistant',
        content: msg.content || 'Continuiamo.',
      };
    });

    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.35, // disciplined pedagogical focus
      maxOutputTokens: 8192, // capiente per evitare qualsiasi blocco a metà durante riassunti, schemi o spiegazioni estese
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
