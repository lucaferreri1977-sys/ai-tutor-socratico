import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SubjectId, SUBJECTS, QuizQuestion } from '@/lib/types';
import { getAuthorizedUser } from '@/lib/auth-check';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = getAuthorizedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    const { subject, topic } = (await req.json()) as {
      subject: SubjectId;
      topic?: string;
    };

    if (!subject || !SUBJECTS[subject]) {
      return new Response(JSON.stringify({ error: 'Materia non valida' }), { status: 400 });
    }

    const subjectMeta = SUBJECTS[subject];
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chiave API Gemini mancante' }), { status: 500 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    const promptTopic = topic && topic.trim().length > 0 ? `sull'argomento specifico: "${topic.trim()}"` : `sul programma generale di scuola media`;

    const systemPrompt = `
Sei un esperto docente per la scuola secondaria di primo grado (scuola media, ragazzi di 11-14 anni).
Il tuo compito è generare un test di apprendimento interattivo (stile NotebookLM / quiz didattico) di 5 domande a risposta multipla per la materia: **${subjectMeta.name}** (${subjectMeta.category}) ${promptTopic}.

REGOLE TASSATIVE:
1. Genera ESATTAMENTE 5 domande a risposta multipla calibrate per il livello scolastico delle medie.
2. Ogni domanda deve avere ESATTAMENTE 4 opzioni di risposta (una sola corretta e tre plausibili distrattori didattici).
3. Includi una spiegazione chiara, incoraggiante e formativa per ciascuna domanda.
4. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido privo di markdown extra o testo fuori dal JSON.

Formato JSON atteso:
{
  "topic": "${topic?.trim() || subjectMeta.name}",
  "questions": [
    {
      "id": "q1",
      "question": "Testo chiaro della prima domanda...",
      "options": ["Opzione A", "Opzione B", "Opzione C", "Opzione D"],
      "correctOptionIndex": 0,
      "explanation": "Spiegazione didattica del perché questa è la risposta corretta..."
    },
    ... altre 4 domande
  ]
}
`;

    const result = await generateText({
      model: google(modelName),
      system: systemPrompt,
      prompt: `Genera ora il test di verifica di 5 domande per ${subjectMeta.name} ${promptTopic}. Rispondi solo in formato JSON.`,
      temperature: 0.3,
    });

    let cleaned = result.text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned) as { topic?: string; questions: QuizQuestion[] };

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Formato quiz non valido restituito dall\'AI');
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Quiz generation error:', error);
    const msg = error instanceof Error ? error.message : 'Errore nella generazione del test';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
