import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { SubjectId, SUBJECTS, QuizQuestion, StudentId, QuizTestRecord, ReinforcementRecapPoint } from '@/lib/types';
import { getAuthorizedUser } from '@/lib/auth-check';
import { getFirestoreDb, TUTOR_QUIZZES_COLLECTION } from '@/lib/firebase-admin';
import { cleanTopicInput } from '@/lib/topic-utils';
import { parseQuizJson, shuffleQuizOptions } from '@/lib/quiz-parser';

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
      files,
      attachments,
      questionCount: rawCount,
      excludeQuestions: clientExcludeQuestions,
      mode = 'standard',
      missedQuestions,
    } = (await req.json()) as {
      subject: SubjectId;
      studentId?: StudentId;
      topic?: string;
      images?: string[];
      files?: string[];
      attachments?: string[];
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
    const rawAttachments = images || files || attachments || [];
    const hasAttachments = Array.isArray(rawAttachments) && rawAttachments.length > 0;

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

      let reinforcementStreamErrorMessage: string | null = null;
      const reinforcementResult = streamText({
        model: google(modelName),
        system: reinforcementSystemPrompt,
        messages: [{ role: 'user', content: [{ type: 'text', text: reinforcementUserText }] }],
        temperature: 0.5,
        maxOutputTokens: 8192,
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        },
        onError({ error }: { error: any }) {
          console.error('Reinforcement streamText error:', error);
          const msg = error?.message || String(error);
          reinforcementStreamErrorMessage = msg.includes('prepayment credits') || msg.includes('depleted') || error?.statusCode === 402
            ? 'I crediti dell\'API Google Gemini sono esauriti.'
            : `Errore: ${msg}`;
        },
      });

      const customReinforcementStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of reinforcementResult.textStream) {
              controller.enqueue(encoder.encode(chunk));
            }
            if (reinforcementStreamErrorMessage) {
              controller.enqueue(encoder.encode(`\n\n⚠️ ${reinforcementStreamErrorMessage}`));
            }
            controller.close();
          } catch (err: any) {
            const errorMsg = reinforcementStreamErrorMessage || err?.message || 'Errore durante la generazione del ripasso.';
            controller.enqueue(encoder.encode(`\n\n⚠️ ${errorMsg}`));
            controller.close();
          }
        },
      });

      return new Response(customReinforcementStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
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

${hasAttachments ? `ATTENZIONE SPECIFICA SUI DOCUMENTI / FOTO FORNITI:
Lo studente ha caricato ${rawAttachments.length} allegati (documenti PDF e/o foto contenenti pagine di libro di testo o quaderno di 3ª Media).
DEVI LEGGERE E ANALIZZARE ATTENTAMENTE IL TESTO, LE IMMAGINI, I GRAFICI (es. grafici cartesiani), LE DEFINIZIONI, LE FORMULE E GLI ESERCIZI NELLE PAGINE DEI DOCUMENTI/FOTO FORNITI.
Le ${questionCount} domande DEVONO essere basate direttamente su quanto spiegato o illustrato in queste pagine.
Se lo studente ha indicato un argomento ("${promptTopic || 'non specificato'}"), concentrati su quella sezione delle pagine; altrimenti copri i punti chiave dei documenti/foto e indica l'argomento dedotto nel campo "topic".` : ''}

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
  "topic": "${promptTopic || (hasAttachments ? 'Argomento tratto dai documenti/foto caricati' : subjectMeta.name)}",
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
    if (hasAttachments) {
      userPromptText = `Ecco i documenti PDF / foto delle pagine del libro/quaderno su cui basare il test di verifica per ${subjectMeta.name}.
${promptTopic ? `Argomento di riferimento specificato: "${promptTopic}".` : 'Identifica l\'argomento dalle pagine.'}
Genera ESATTAMENTE ${questionCount} domande a scelta multipla (il numero ${questionCount} è fissato e vincolante) basate su queste pagine. Rispondi solo in formato JSON.`;
    } else {
      userPromptText = `Genera un test di verifica di ESATTAMENTE ${questionCount} domande a scelta multipla (il numero ${questionCount} è fissato e vincolante) per ${subjectMeta.name} ${promptTopic ? `sull'argomento: "${promptTopic}"` : 'sul programma generale delle medie'}. Rispondi solo in formato JSON.`;
    }

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: string }
      | { type: 'file'; data: string; mediaType: string }
    > = [
      { type: 'text', text: userPromptText },
    ];

    if (hasAttachments) {
      for (const item of rawAttachments) {
        if (typeof item === 'string' && item.startsWith('data:application/pdf')) {
          userContent.push({
            type: 'file',
            data: item,
            mediaType: 'application/pdf',
          });
        } else if (typeof item === 'string') {
          userContent.push({
            type: 'image',
            image: item,
          });
        }
      }
    }

    let streamErrorMessage: string | null = null;
    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.5,
      maxOutputTokens: 8192,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
      onError({ error }: { error: any }) {
        console.error('Quiz streamText error:', error);
        const msg = error?.message || String(error);
        if (msg.includes('prepayment credits') || msg.includes('depleted') || (error as any)?.statusCode === 402) {
          streamErrorMessage = 'I crediti dell\'API Google Gemini sono esauriti. Ricarica il credito prepagato su Google AI Studio per generare verifiche.';
        } else if (msg.includes('RESOURCE_EXHAUSTED') || (error as any)?.statusCode === 429) {
          streamErrorMessage = 'Limite di richieste temporaneamente superato per Google Gemini. Attendi un momento e riprova.';
        } else {
          streamErrorMessage = `Errore di connessione a Google Gemini: ${msg}`;
        }
      },
    });

    const customStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          if (streamErrorMessage) {
            controller.enqueue(encoder.encode(`\n\n⚠️ ${streamErrorMessage}`));
          }
          controller.close();
        } catch (err: any) {
          console.error('Error during textStream consumption:', err);
          const errorMsg = streamErrorMessage || err?.message || 'Errore durante la generazione della verifica.';
          controller.enqueue(encoder.encode(`\n\n⚠️ ${errorMsg}`));
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Quiz generation error:', error);
    let msg = error instanceof Error ? error.message : 'Errore nella generazione del test';
    if (msg.includes('prepayment credits') || msg.includes('depleted') || (error as any)?.statusCode === 402) {
      msg = 'I crediti dell\'API Google Gemini sono esauriti. Ricarica il credito prepagato su Google AI Studio (ai.studio/projects) per generare verifiche.';
    }
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
