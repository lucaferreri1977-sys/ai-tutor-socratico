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

    const { subject, topic, images } = (await req.json()) as {
      subject: SubjectId;
      topic?: string;
      images?: string[];
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

    const hasImages = Array.isArray(images) && images.length > 0;
    const promptTopic = topic && topic.trim().length > 0 ? topic.trim() : '';

    const systemPrompt = `
Sei un esperto docente per la scuola secondaria di primo grado (scuola media italiana, ragazzi di 11-14 anni).
Il tuo compito è creare un test didattico formativo di 5 domande a risposta multipla per la materia: **${subjectMeta.name}** (${subjectMeta.category}).

${hasImages ? `ATTENZIONE SPECIFICA SULLE FOTO FORNITE:
Lo studente ha caricato ${images.length} foto contenenti pagine di libro di testo, schede o appunti di quaderno.
DEVI LEGGERE E ANALIZZARE ATTENTAMENTE IL TESTO, LE IMMAGINI, I GRAFICI, LE DEFINIZIONI, LE FORMULE E GLI ESERCIZI NELLE IMMAGINI FORNITE.
Le 5 domande DEVONO essere basate direttamente su quanto spiegato o illustrato in queste pagine fotografate.
Se lo studente ha indicato un argomento ("${promptTopic || 'non specificato'}"), concentrati su quella sezione delle pagine; altrimenti copri i punti chiave delle pagine fotografate e indica l'argomento dedotto nel campo "topic".` : ''}

REGOLE TASSATIVE:
1. Genera ESATTAMENTE 5 domande a risposta multipla calibrate per il livello scolastico delle medie.
2. Ogni domanda deve avere ESATTAMENTE 4 opzioni di risposta (una sola corretta e tre plausibili distrattori didattici).
3. Includi una spiegazione chiara, incoraggiante e formativa per ciascuna domanda.
4. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido privo di markdown extra o testo fuori dal JSON.

Formato JSON atteso:
{
  "topic": "${promptTopic || (hasImages ? 'Argomento tratto dalle pagine caricate' : subjectMeta.name)}",
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

    // Construct prompt content
    let userPromptText = '';
    if (hasImages) {
      userPromptText = `Ecco le foto delle pagine del libro/quaderno su cui basare il test di verifica per ${subjectMeta.name}.
${promptTopic ? `Argomento di riferimento specificato: "${promptTopic}".` : 'Identifica l\'argomento dalle pagine.'}
Genera 5 domande a scelta multipla basate su queste pagine. Rispondi solo in formato JSON.`;
    } else {
      userPromptText = `Genera un test di verifica di 5 domande per ${subjectMeta.name} ${promptTopic ? `sull'argomento: "${promptTopic}"` : 'sul programma generale delle medie'}. Rispondi solo in formato JSON.`;
    }

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: string }
    > = [
      { type: 'text', text: userPromptText },
    ];

    if (hasImages) {
      for (const img of images) {
        userContent.push({
          type: 'image',
          image: img,
        });
      }
    }

    const result = await generateText({
      model: google(modelName),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.25,
    });

    let cleaned = result.text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Safeguard to extract JSON if surrounded by any additional commentary
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
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
