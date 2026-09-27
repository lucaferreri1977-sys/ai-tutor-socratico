import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SubjectId, SUBJECTS, QuizQuestion, StudentId, QuizTestRecord } from '@/lib/types';
import { getAuthorizedUser } from '@/lib/auth-check';
import { getFirestoreDb, TUTOR_QUIZZES_COLLECTION } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = getAuthorizedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401 });
    }

    const {
      subject,
      studentId,
      topic,
      images,
      questionCount: rawCount,
      excludeQuestions: clientExcludeQuestions,
    } = (await req.json()) as {
      subject: SubjectId;
      studentId?: StudentId;
      topic?: string;
      images?: string[];
      questionCount?: number;
      excludeQuestions?: string[];
    };

    if (!subject || !SUBJECTS[subject]) {
      return new Response(JSON.stringify({ error: 'Materia non valida' }), { status: 400 });
    }

    const questionCount = Math.max(5, Math.min(30, Number(rawCount) || 10));
    const subjectMeta = SUBJECTS[subject];
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Chiave API Gemini mancante' }), { status: 500 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

    const hasImages = Array.isArray(images) && images.length > 0;
    const promptTopic = topic && topic.trim().length > 0 ? topic.trim() : '';

    // Recupera lo storico delle domande già somministrate per non ripeterle
    const pastQuestionsSet = new Set<string>();

    if (Array.isArray(clientExcludeQuestions)) {
      clientExcludeQuestions.forEach((q) => {
        if (typeof q === 'string' && q.trim()) {
          pastQuestionsSet.add(q.trim());
        }
      });
    }

    if (studentId) {
      try {
        const db = getFirestoreDb();
        const snapshot = await db
          .collection(TUTOR_QUIZZES_COLLECTION)
          .where('studentId', '==', studentId)
          .where('subject', '==', subject)
          .get();

        const docs = snapshot.docs.map((d) => d.data() as QuizTestRecord);
        docs.sort((a, b) => {
          const tA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tB - tA;
        });

        const targetTopicLower = promptTopic.toLowerCase();
        for (const quiz of docs) {
          if (Array.isArray(quiz.answers)) {
            const quizTopicLower = (quiz.topic || '').toLowerCase();
            const isRelevant =
              !targetTopicLower ||
              quizTopicLower.includes(targetTopicLower) ||
              targetTopicLower.includes(quizTopicLower) ||
              docs.length <= 5;

            if (isRelevant) {
              quiz.answers.forEach((ans) => {
                if (ans.questionText && ans.questionText.trim()) {
                  pastQuestionsSet.add(ans.questionText.trim());
                }
              });
            }
          }
        }

        // Se l'insieme è ancora limitato, aggiungi domande anche dalle altre verifiche della stessa materia
        if (pastQuestionsSet.size < 25) {
          for (const quiz of docs) {
            if (Array.isArray(quiz.answers)) {
              quiz.answers.forEach((ans) => {
                if (ans.questionText && ans.questionText.trim()) {
                  pastQuestionsSet.add(ans.questionText.trim());
                }
              });
            }
          }
        }
      } catch (err) {
        console.warn('Impossibile recuperare storico verifiche per deduplicazione:', err);
      }
    }

    const pastQuestionsList = Array.from(pastQuestionsSet).slice(0, 35);

    const deduplicationInstructions =
      pastQuestionsList.length > 0
        ? `
REGOLA CRITICA DI NON-RIPETIZIONE DELLE DOMANDE (MASSIMA PRIORITÀ):
Lo studente ha già sostenuto verifiche su questo argomento/materia e si ricorda le domande precedenti!
NON DEVI ASSOLUTAMENTE RIPETERE o RIFORMULARE IN MODO BANALE nessuna delle seguenti domande già svolte:
${pastQuestionsList.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}

COME CREARE DOMANDE NUOVE E DIVERSIFICATE:
- Esplora altri aspetti teorici, definizioni, proprietà, eccezioni o applicazioni pratiche dell'argomento.
- Se si tratta di quesiti o problemi matematici/scientifici con calcoli: CAMBIA COMPLETAMENTE TUTTI I NUMERI, formule, figure geometriche, valori o grandezze in gioco.
- Se si tratta di lingue/grammatica/letteratura/storia/geografia: usa frasi di esempio, contesti, eventi, personaggi o termini totalmente diversi.
- Se ci sono foto del libro o quaderno: individua altri paragrafi, concetti, dettagli o esercizi presenti nelle immagini.`
        : `
REGOLA DI VARIETÀ E CREATIVITÀ:
Formula domande originali, variegate e stimolanti. Non limitarti alle domande più ovvie o scontate: esplora diverse angolazioni dell'argomento e varia i valori numerici e gli esempi.`;

    const systemPrompt = `
Sei un esperto docente per la scuola secondaria di primo grado (scuola media italiana, ragazzi di 11-14 anni).
Il tuo compito è creare un test didattico formativo di ${questionCount} domande a risposta multipla per la materia: **${subjectMeta.name}** (${subjectMeta.category}).

${hasImages ? `ATTENZIONE SPECIFICA SULLE FOTO FORNITE:
Lo studente ha caricato ${images.length} foto contenenti pagine di libro di testo, schede o appunti di quaderno.
DEVI LEGGERE E ANALIZZARE ATTENTAMENTE IL TESTO, LE IMMAGINI, I GRAFICI, LE DEFINIZIONI, LE FORMULE E GLI ESERCIZI NELLE IMMAGINI FORNITE.
Le ${questionCount} domande DEVONO essere basate direttamente su quanto spiegato o illustrato in queste pagine fotografate.
Se lo studente ha indicato un argomento ("${promptTopic || 'non specificato'}"), concentrati su quella sezione delle pagine; altrimenti copri i punti chiave delle pagine fotografate e indica l'argomento dedotto nel campo "topic".` : ''}

${deduplicationInstructions}

REGOLE TASSATIVE:
1. Genera ESATTAMENTE ${questionCount} domande a risposta multipla calibrate per il livello scolastico delle medie.
2. Ogni domanda deve avere ESATTAMENTE 4 opzioni di risposta (una sola corretta e tre plausibili distrattori didattici).
3. DISTRIBUZIONE CASUALE: Alterna e distribuisci la risposta corretta in modo casuale ed equilibrato tra tutte le posizioni (A, B, C, D), variando il valore di 'correctOptionIndex' (0, 1, 2 o 3). NON inserire sempre la risposta corretta al primo posto!
4. VARIETÀ ASSOLUTA: Nessuna domanda deve essere identica o quasi identica a quelle già viste in precedenza dallo studente né a un'altra domanda dello stesso test.
5. SUGGERIMENTO MAIEUTICO ("hint"): Per ciascuna domanda DEVI generare un campo "hint" (suggerimento socratico). Deve essere un breve indizio di metodo, un promemoria di regola o una pista di ragionamento per aiutare lo studente a sbloccarsi da solo, SENZA MAI svelare la risposta esatta né fare riferimenti alle opzioni o alle lettere (A, B, C, D).
6. Includi una spiegazione chiara, incoraggiante e formativa per ciascuna domanda.
7. Rispondi ESCLUSIVAMENTE con un oggetto JSON valido privo di markdown extra o testo fuori dal JSON.

Formato JSON atteso:
{
  "topic": "${promptTopic || (hasImages ? 'Argomento tratto dalle pagine caricate' : subjectMeta.name)}",
  "questions": [
    {
      "id": "q1",
      "question": "Testo chiaro della prima domanda...",
      "options": ["Distrattore A", "Risposta corretta", "Distrattore C", "Distrattore D"],
      "correctOptionIndex": 1,
      "hint": "Indizio di metodo o promemoria di ragionamento senza dare la soluzione...",
      "explanation": "Spiegazione didattica del perché questa è la risposta corretta..."
    }
  ]
}
`;

    // Construct prompt content
    let userPromptText = '';
    if (hasImages) {
      userPromptText = `Ecco le foto delle pagine del libro/quaderno su cui basare il test di verifica per ${subjectMeta.name}.
${promptTopic ? `Argomento di riferimento specificato: "${promptTopic}".` : 'Identifica l\'argomento dalle pagine.'}
Genera ${questionCount} domande a scelta multipla COMPLETAMENTE NUOVE E MAI RIPETUTE basate su queste pagine. Rispondi solo in formato JSON.`;
    } else {
      userPromptText = `Genera un test di verifica di ${questionCount} domande COMPLETAMENTE NUOVE E MAI RIPETUTE per ${subjectMeta.name} ${promptTopic ? `sull'argomento: "${promptTopic}"` : 'sul programma generale delle medie'}. Rispondi solo in formato JSON.`;
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
      temperature: 0.75, // Permette creatività, variabilità ed evita risposte identiche e deterministiche
      maxOutputTokens: 8192,
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

    // 4. Algoritmo Fisher-Yates per mescolare in modo rigoroso e casuale le 4 opzioni di ogni domanda
    // Garantisce matematicamente che la risposta corretta sia equamente distribuita tra A, B, C e D (0, 1, 2, 3)
    const randomizedQuestions = parsed.questions.map((q, qIdx) => {
      if (!Array.isArray(q.options) || q.options.length <= 1) {
        return q;
      }

      const rawCorrectIndex =
        typeof q.correctOptionIndex === 'number' &&
        q.correctOptionIndex >= 0 &&
        q.correctOptionIndex < q.options.length
          ? q.correctOptionIndex
          : 0;

      // Memorizza il testo della risposta corretta
      const correctOptionText = q.options[rawCorrectIndex];

      // Crea coppie con indicatore di correttezza
      const items = q.options.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === rawCorrectIndex,
      }));

      // Fisher-Yates shuffle
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }

      const shuffledOptions = items.map((it) => it.text);
      const newCorrectIndex = items.findIndex((it) => it.isCorrect);

      return {
        ...q,
        id: q.id || `q-${qIdx + 1}`,
        options: shuffledOptions,
        correctOptionIndex: newCorrectIndex !== -1 ? newCorrectIndex : 0,
        hint: typeof q.hint === 'string' && q.hint.trim() ? q.hint.trim() : undefined,
      };
    });

    return new Response(JSON.stringify({ ...parsed, questions: randomizedQuestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Quiz generation error:', error);
    const msg = error instanceof Error ? error.message : 'Errore nella generazione del test';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
