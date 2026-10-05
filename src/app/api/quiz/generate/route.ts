import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { jsonrepair } from 'jsonrepair';
import { SubjectId, SUBJECTS, QuizQuestion, StudentId, QuizTestRecord, ReinforcementRecapPoint } from '@/lib/types';
import { getAuthorizedUser } from '@/lib/auth-check';
import { getFirestoreDb, TUTOR_QUIZZES_COLLECTION } from '@/lib/firebase-admin';
import { cleanTopicInput } from '@/lib/topic-utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

function parseQuizJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 1. Primo tentativo: JSON.parse nativo
  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    console.warn('Initial JSON.parse failed, attempting jsonrepair:', initialErr);
  }

  // 2. Secondo tentativo: jsonrepair (ripara virgolette, virgole mancanti/extra, parentesi)
  try {
    const repaired = jsonrepair(cleaned);
    return JSON.parse(repaired) as T;
  } catch (repairErr) {
    console.warn('jsonrepair failed, attempting regex sanitization:', repairErr);
  }

  // 3. Terzo tentativo: rimozione backslash non validi di LaTeX (es. \sqrt, \times, \circ) e virgole prima di parentesi chiuse
  try {
    const sanitized = cleaned
      .replace(/\\([^"\\\/bfnrtu])/g, '$1')
      .replace(/,\s*([\]}])/g, '$1');
    const repairedSanitized = jsonrepair(sanitized);
    return JSON.parse(repairedSanitized) as T;
  } catch (finalErr) {
    console.error('All JSON parsing attempts failed:', finalErr, 'Raw snippet:', cleaned.slice(0, 500));
    throw new Error('Socrate ha riscontrato una piccola anomalia nella formattazione del test. Riprova a cliccare su Avvia Verifica!');
  }
}

function shuffleQuizOptions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q, qIdx) => {
    if (!Array.isArray(q.options) || q.options.length <= 1) {
      return q;
    }

    const rawCorrectIndex =
      typeof q.correctOptionIndex === 'number' &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < q.options.length
        ? q.correctOptionIndex
        : 0;

    const items = q.options.map((opt, idx) => ({
      text: opt,
      isCorrect: idx === rawCorrectIndex,
    }));

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
}

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
      mode = 'standard',
      missedQuestions,
    } = (await req.json()) as {
      subject: SubjectId;
      studentId?: StudentId;
      topic?: string;
      images?: string[];
      questionCount?: number;
      excludeQuestions?: string[];
      mode?: 'standard' | 'reinforcement';
      missedQuestions?: Array<{
        questionText: string;
        selectedOptionText?: string;
        correctOptionText?: string;
        explanation?: string;
      }>;
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
    const cleanedTopic = cleanTopicInput(topic);
    const promptTopic = cleanedTopic.length > 0 ? cleanedTopic : '';
    // Il numero di domande è ESCLUSIVAMENTE quello preimpostato dai pulsanti (minimo 20 o 30 domande)
    const allowedCounts = [20, 30];
    const parsedCount = Number(rawCount);
    const questionCount = allowedCounts.includes(parsedCount) ? parsedCount : 20;
    const hasImages = Array.isArray(images) && images.length > 0;

    // ==========================================
    // MODALITÀ REINFORCEMENT (RIPASSO & RECUPERO ERRORI)
    // ==========================================
    if (mode === 'reinforcement' && Array.isArray(missedQuestions) && missedQuestions.length > 0) {
      const reinforcementCount = Math.min(missedQuestions.length, 10);

      const reinforcementSystemPrompt = `
Sei Socrate, esperto docente e tutor empatico per la scuola secondaria di primo grado italiana, specificamente per la classe **3ª Media (Terza Media, 13-14 anni, anno dell'esame di Stato)**.
Uno studente di 3ª Media ha terminato una verifica di **${subjectMeta.name}** (${subjectMeta.category}) e ha risposto in modo errato a ${missedQuestions.length} quesiti.
Il tuo compito ora è guidarlo nel **RECUPERO E RINFORZO DEGLI ERRORI (Mastery Learning Socratico)**:
1. Genera una **Scheda di Ripasso Mirato** ("recapPoints"): per ciascun errore, isola il concetto didattico sottostante, spiega la regola in modo chiarissimo e semplice (max 2 frasi) con livello adeguato a uno studente di 3ª Media, e fornisci un trucco pratico o consiglio mentale di Socrate per non cadere più in trappola.
2. Genera un **Mini-Test di Rivincita** ("questions"): esattamente ${reinforcementCount} domande a risposta multipla inedite (una per ciascun concetto errato).

REGOLE TASSATIVE PER LE DOMANDE DEL MINI-TEST:
1. Genera ESATTAMENTE ${reinforcementCount} domande a risposta multipla calibrate sul livello di 3ª Media (4 opzioni per domanda, 1 corretta e 3 plausibili distrattori didattici).
2. Ciascuna domanda DEVE riguardare lo stesso concetto/abilità dell'errore corrispondente, MA DEVE ESSERE COMPLETAMENTE DIVERSA DALLA DOMANDA ORIGINALE: cambia totalmente valori numerici, figure, formule, frasi d'esempio o contesti! NON riproporre le stesse domande.
3. DISTRIBUZIONE CASUALE: Alterna e distribuisci la risposta corretta tra tutte le posizioni (A, B, C, D).
4. SUGGERIMENTO MAIEUTICO ("hint"): Per ciascuna domanda fornisci un breve indizio di metodo senza svelare la soluzione.
5. Includi una spiegazione chiara ("explanation") per la risposta corretta.
6. REGOLE RIGOROSE PER IL FORMATO JSON:
   - Rispondi ESCLUSIVAMENTE con un oggetto JSON valido privo di markdown o commenti esterni.
   - NON usare MAI virgolette doppie (") all'interno dei testi delle domande, opzioni o spiegazioni: usa sempre apici singoli (') o caporali (« »).
   - Nelle formule matematiche non usare backslash isolati.
   - Nessuna virgola finale prima di ] o }.

Formato JSON atteso:
{
  "topic": "${promptTopic || subjectMeta.name}",
  "recapPoints": [
    {
      "concept": "Nome del concetto chiave (es. Precedenza delle operazioni o Accordo del participio)",
      "summary": "Spiegazione chiara e semplice della regola per un ragazzo delle medie.",
      "tip": "Un trucco mnemonico o consiglio pratico di Socrate."
    }
  ],
  "questions": [
    {
      "id": "rq1",
      "question": "Nuova domanda di verifica inedita su questo concetto...",
      "options": ["Opzione A", "Opzione B", "Opzione C", "Opzione D"],
      "correctOptionIndex": 1,
      "hint": "Breve indizio di metodo...",
      "explanation": "Spiegazione chiara della risposta corretta..."
    }
  ]
}
`;

      const reinforcementUserText = `Ecco gli errori commessi dallo studente nel test precedente di ${subjectMeta.name} ${promptTopic ? `sull'argomento "${promptTopic}"` : ''}:
${missedQuestions.map((m, idx) => `
ERRORE ${idx + 1}:
- Domanda originale: "${m.questionText}"
${m.selectedOptionText ? `- Risposta errata selezionata dallo studente: "${m.selectedOptionText}"` : ''}
${m.correctOptionText ? `- Risposta corretta attesa: "${m.correctOptionText}"` : ''}
${m.explanation ? `- Spiegazione: "${m.explanation}"` : ''}
`).join('\n')}

Genera la Scheda di Ripasso ("recapPoints", uno per ciascun errore) e il Mini-Test di Rivincita ("questions", esattamente ${reinforcementCount} nuove domande diverse). Rispondi solo in JSON.`;

      const reinforcementResult = await generateText({
        model: google(modelName),
        system: reinforcementSystemPrompt,
        messages: [{ role: 'user', content: [{ type: 'text', text: reinforcementUserText }] }],
        temperature: 0.7,
        maxOutputTokens: 8192,
      });

      const parsedReinforcement = parseQuizJson<{
        topic?: string;
        recapPoints?: ReinforcementRecapPoint[];
        questions: QuizQuestion[];
      }>(reinforcementResult.text);

      if (!parsedReinforcement.questions || !Array.isArray(parsedReinforcement.questions) || parsedReinforcement.questions.length === 0) {
        throw new Error('Formato quiz di recupero non valido restituito dall\'AI');
      }

      const randomizedReinforcementQuestions = shuffleQuizOptions(parsedReinforcement.questions);

      return new Response(
        JSON.stringify({
          topic: parsedReinforcement.topic || promptTopic || subjectMeta.name,
          recapPoints: parsedReinforcement.recapPoints || [],
          questions: randomizedReinforcementQuestions,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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
Sei un esperto docente per la scuola secondaria di primo grado italiana, specificamente per la classe **3ª Media (Terza Media, 13-14 anni, anno dell'esame conclusivo di Stato)**.
Il tuo compito è creare un test didattico formativo di ${questionCount} domande a risposta multipla per la materia: **${subjectMeta.name}** (${subjectMeta.category}).

REGOLA IMPERATIVA E NON NEGOZIABILE SUL NUMERO DI DOMANDE (${questionCount}):
- DEVI GENERARE TASSATIVAMENTE ED ESATTAMENTE ${questionCount} DOMANDE NELL'ARRAY "questions".
- L'utente ha selezionato ${questionCount} domande tramite i pulsanti ufficiali dell'interfaccia.
- SE NEL TESTO DELL'ARGOMENTO L'UTENTE HA INDICATO O RICHIESTO UN ALTRO NUMERO DI DOMANDE (ad es. "fammi 5 domande", "15 domande", ecc.), DEVI IGNORARE TOTALMENTE QUEL NUMERO: IL NUMERO UFFICIALE ED INDISCUTIBILE È ESCLUSIVAMENTE ${questionCount}. L'argomento dell'utente serve solo a identificare i temi didattici da trattare, non il numero di domande.

LIVELLO SCOLASTICO OBBLIGATORIO (3ª MEDIA):
Lo studente frequenta la **3ª Media in Italia**. Formula quesiti, esercizi e problemi esattamente calibrati sul programma ministeriale di 3ª Media:
- Matematica e Geometria: calcolo letterale, monomi, polinomi, equazioni di primo grado, piano cartesiano e rette, Teorema di Pitagora, aree e perimetri di poligoni complessi, elementi di geometria solida (prismi, piramidi, cilindri).
- Scienze: genetica e leggi di Mendel, DNA, sistema nervoso ed endocrino, astronomia e sistema solare, tettonica delle placche.
- Italiano e altre materie: analisi logica del periodo, figure retoriche, Novecento storico, Costituzione e cittadinanza.

${hasImages ? `ATTENZIONE SPECIFICA SULLE FOTO FORNITE:
Lo studente ha caricato ${images.length} foto contenenti pagine di libro di testo o quaderno di 3ª Media.
DEVI LEGGERE E ANALIZZARE ATTENTAMENTE IL TESTO, LE IMMAGINI, I GRAFICI (es. grafici cartesiani), LE DEFINIZIONI, LE FORMULE E GLI ESERCIZI NELLE IMMAGINI FORNITE.
Le ${questionCount} domande DEVONO essere basate direttamente su quanto spiegato o illustrato in queste pagine fotografate.
Se lo studente ha indicato un argomento ("${promptTopic || 'non specificato'}"), concentrati su quella sezione delle pagine; altrimenti copri i punti chiave delle pagine fotografate e indica l'argomento dedotto nel campo "topic".` : ''}

${deduplicationInstructions}

REGOLE TASSATIVE:
1. Genera ESATTAMENTE ${questionCount} domande a risposta multipla calibrate per il livello scolastico di 3ª Media.
2. Ogni domanda deve avere ESATTAMENTE 4 opzioni di risposta (una sola corretta e tre plausibili distrattori didattici).
3. DISTRIBUZIONE CASUALE: Alterna e distribuisci la risposta corretta in modo casuale ed equilibrato tra tutte le posizioni (A, B, C, D), variando il valore di 'correctOptionIndex' (0, 1, 2 o 3). NON inserire sempre la risposta corretta al primo posto!
4. VARIETÀ ASSOLUTA: Nessuna domanda deve essere identica o quasi identica a quelle già viste in precedenza dallo studente né a un'altra domanda dello stesso test.
5. SUGGERIMENTO MAIEUTICO ("hint"): Per ciascuna domanda DEVI generare un campo "hint" (suggerimento socratico). Deve essere un breve indizio di metodo, un promemoria di regola o una pista di ragionamento per aiutare lo studente a sbloccarsi da solo, SENZA MAI svelare la risposta esatta né fare riferimenti alle opzioni o alle lettere (A, B, C, D).
6. Includi una spiegazione chiara, incoraggiante e formativa per ciascuna domanda.
7. REGOLE RIGOROSE PER IL FORMATO JSON (FONDAMENTALE PER EVITARE ERRORI DI PARSING):
   - Rispondi ESCLUSIVAMENTE con un oggetto JSON valido privo di testo o commenti all'esterno.
   - NON usare MAI virgolette doppie (") all'interno del testo delle domande, delle opzioni o delle spiegazioni: usa sempre apici singoli (') oppure apici caporali (« »). Esempio corretto: "Qual è il valore di 'x' nell'equazione?" (NON "Qual è il valore di "x"").
   - Nelle formule matematiche, NON usare backslash isolati di LaTeX (scrivi "sqrt(25)" anziché "\\sqrt{25}", "x^2" anziché "x^{2}", "18 gradi" o "18°" senza caratteri di escape non standard).
   - Non inserire virgole finali superflue dopo l'ultimo elemento di array o oggetti.

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
Genera ESATTAMENTE ${questionCount} domande a scelta multipla (il numero ${questionCount} è fissato e vincolante) basate su queste pagine. Rispondi solo in formato JSON.`;
    } else {
      userPromptText = `Genera un test di verifica di ESATTAMENTE ${questionCount} domande a scelta multipla (il numero ${questionCount} è fissato e vincolante) per ${subjectMeta.name} ${promptTopic ? `sull'argomento: "${promptTopic}"` : 'sul programma generale delle medie'}. Rispondi solo in formato JSON.`;
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

    const parsed = parseQuizJson<{ topic?: string; questions: QuizQuestion[] }>(result.text);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Formato quiz non valido restituito dall\'AI');
    }

    const randomizedQuestions = shuffleQuizOptions(parsed.questions);
    // Se l'AI ha generato più domande del previsto, tronca al numero esatto selezionato
    const finalQuestions = randomizedQuestions.length > questionCount
      ? randomizedQuestions.slice(0, questionCount)
      : randomizedQuestions;

    return new Response(JSON.stringify({
      topic: promptTopic || parsed.topic || (hasImages ? `Verifica da ${images.length} foto libro` : subjectMeta.name),
      questions: finalQuestions,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Quiz generation error:', error);
    const msg = error instanceof Error ? error.message : 'Errore nella generazione del test';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
