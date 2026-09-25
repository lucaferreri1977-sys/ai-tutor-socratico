export type SubjectId =
  | 'matematica'
  | 'scienze'
  | 'italiano_grammatica'
  | 'italiano_scrittura'
  | 'storia'
  | 'geografia'
  | 'inglese'
  | 'francese'
  | 'tecnologia'
  | 'musica'
  | 'arte';

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  category: 'STEM' | 'Umanistica' | 'Lingue' | 'Arte & Tecnica';
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
  quickPrompts: string[];
}

export type StudentId = 'alessio' | 'mattia';

export interface StudentProfile {
  id: StudentId;
  name: string;
  avatar: string;
  grade: string;
  themeColor: string;
  welcomeMessage: string;
}

export const STUDENTS: Record<StudentId, StudentProfile> = {
  alessio: {
    id: 'alessio',
    name: 'Alessio',
    avatar: '👦',
    grade: 'Scuola Media',
    themeColor: 'sky',
    welcomeMessage: 'Ciao Alessio! Sono Socrate, pronto a darti una mano con i compiti. Cosa studiamo oggi?',
  },
  mattia: {
    id: 'mattia',
    name: 'Mattia',
    avatar: '🧒',
    grade: 'Scuola Media',
    themeColor: 'indigo',
    welcomeMessage: 'Ciao Mattia! Sono Socrate, il tuo compagno di studio. Su quale argomento ci concentriamo?',
  },
};

export interface ChatSessionSummary {
  id: string;
  studentId: StudentId;
  studentName: string;
  subject: SubjectId;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
  matematica: {
    id: 'matematica',
    name: 'Matematica & Geometria',
    category: 'STEM',
    emoji: '📐',
    color: 'border-blue-500 text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    description: 'Equazioni, frazioni, problemi di geometria, aree e perimetri.',
    quickPrompts: [
      'Ho un problema di geometria con frazioni',
      'Non capisco come risolvere questa espressione',
      'Come calcolo l’area di un triangolo rettangolo?',
    ],
  },
  scienze: {
    id: 'scienze',
    name: 'Scienze della Terra & Biologia',
    category: 'STEM',
    emoji: '🔬',
    color: 'border-emerald-500 text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    description: 'Corpo umano, cellule, fotosintesi, sistema solare e vulcani.',
    quickPrompts: [
      'Mi spieghi la fotosintesi clorofilliana?',
      'Come funziona la circolazione del sangue?',
      'Cosa sono le placche tettoniche?',
    ],
  },
  italiano_grammatica: {
    id: 'italiano_grammatica',
    name: 'Italiano: Grammatica & Sintassi',
    category: 'Umanistica',
    emoji: '📖',
    color: 'border-amber-500 text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    description: 'Analisi grammaticale, analisi logica e analisi del periodo.',
    quickPrompts: [
      'Aiutami a fare l’analisi logica di questa frase',
      'Come riconosco il complemento di termine?',
      'Che differenza c’è tra transitivo e intransitivo?',
    ],
  },
  italiano_scrittura: {
    id: 'italiano_scrittura',
    name: 'Italiano: Temi & Scrittura',
    category: 'Umanistica',
    emoji: '✍️',
    color: 'border-orange-500 text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
    description: 'Scalette per temi, riassunti, testi argomentativi e relazioni.',
    quickPrompts: [
      'Devo fare un tema sull’amicizia: mi aiuti con la scaletta?',
      'Come posso fare un riassunto efficace?',
      'Come si conclude un testo argomentativo?',
    ],
  },
  storia: {
    id: 'storia',
    name: 'Storia',
    category: 'Umanistica',
    emoji: '🏛️',
    color: 'border-rose-500 text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    description: 'Medioevo, Rinascimento, Risorgimento, guerre e scoperte.',
    quickPrompts: [
      'Quali furono le cause della Rivoluzione Francese?',
      'Aiutami a capire il feudalesimo',
      'Chi erano i protagonisti del Risorgimento?',
    ],
  },
  geografia: {
    id: 'geografia',
    name: 'Geografia',
    category: 'Umanistica',
    emoji: '🌍',
    color: 'border-teal-500 text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    description: 'Stati europei ed extraeuropei, climi, fiumi, monti ed economia.',
    quickPrompts: [
      'Quali sono i fattori che determinano il clima?',
      'Aiutami a schematizzare la geografia della Spagna',
      'Come funzionano i settori economici primario, secondario e terziario?',
    ],
  },
  inglese: {
    id: 'inglese',
    name: 'Inglese (ESL / A1-B1)',
    category: 'Lingue',
    emoji: '🇬🇧',
    color: 'border-indigo-500 text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    description: 'Present Perfect vs Past Simple, vocaboli, speaking & writing.',
    quickPrompts: [
      'When do I use Present Perfect vs Past Simple?',
      'Help me practice a conversation about my hobbies',
      'Check if I used the correct preposition here',
    ],
  },
  francese: {
    id: 'francese',
    name: 'Francese (FLE / A1-A2)',
    category: 'Lingue',
    emoji: '🇫🇷',
    color: 'border-cyan-500 text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    description: 'Passé composé, articoli partitivi, verbi in -er/-ir/-re.',
    quickPrompts: [
      'Come scelgo tra être e avoir al passé composé?',
      'Quando si usano gli articoli partitivi (du, de la, des)?',
      'Aiutami a descrivere la mia giornata in francese',
    ],
  },
  tecnologia: {
    id: 'tecnologia',
    name: 'Tecnologia & Informatica',
    category: 'Arte & Tecnica',
    emoji: '⚙️',
    color: 'border-slate-500 text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300',
    description: 'Disegno tecnico, proiezioni ortogonali, energie rinnovabili, coding.',
    quickPrompts: [
      'Come si fa la proiezione ortogonale di una piramide?',
      'Qual è la differenza tra fonti rinnovabili e non rinnovabili?',
      'Cosa sono le proprietà meccaniche dei materiali?',
    ],
  },
  musica: {
    id: 'musica',
    name: 'Musica & Teoria Musicale',
    category: 'Arte & Tecnica',
    emoji: '🎵',
    color: 'border-purple-500 text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    description: 'Chiave di violino, figure musicali, ritmi, strumenti e compositori.',
    quickPrompts: [
      'Come calcolo il valore delle pause e delle note in un 4/4?',
      'Quali sono le famiglie degli strumenti musicali?',
      'Chi era Ludwig van Beethoven e cosa ha composto?',
    ],
  },
  arte: {
    id: 'arte',
    name: 'Arte & Immagine',
    category: 'Arte & Tecnica',
    emoji: '🎨',
    color: 'border-pink-500 text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
    description: 'Analisi dell’opera d’arte, prospettiva, colore e storia dell’arte.',
    quickPrompts: [
      'Come si legge un’opera d’arte (soggetto, tecnica, significato)?',
      'Come funziona la prospettiva centrale nel Rinascimento?',
      'Qual è la differenza tra colori primari, secondari e complementari?',
    ],
  },
};
