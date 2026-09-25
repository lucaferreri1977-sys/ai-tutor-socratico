# 🦉 Socrate - Tutor AI Socratico per le Scuole Medie (11-14 anni)

Un'applicazione web didattica open source pensata per i ragazzi delle scuole medie (scuola secondaria di primo grado). 
A differenza dei normali modelli linguistici che tendono a risolvere immediatamente i compiti, **Socrate** applica rigorosamente il **metodo socratico (maieutica)**: non fornisce mai le risposte pronte, ma guida gli studenti passo dopo passo attraverso domande stimolo, scomposizione dei problemi ed esempi paralleli.

---

## 🎯 Obiettivi Pedagogici & Regole Chiave

1. **Zero-Solution Policy:** Il modello non fornisce mai il risultato numerico finale, la traduzione completa o il testo di un tema.
2. **Decomposizione Atomica:** Ogni esercizio viene affrontato un micro-passaggio alla volta, con validazione prima di procedere.
3. **Protocollo Isomorfismo ("Esempio Gemello"):** Se lo studente dichiara di essere bloccato, il tutor inventa un problema analogo con numeri o parole diverse per mostrare la logica, chiedendo poi al ragazzo di applicarla al compito originale.
4. **Multimodalità (OCR & Vision):** Possibilità di caricare direttamente la foto del libro degli esercizi o del quaderno con i calcoli a matita.
5. **Formule Matematiche Perfette:** Rendering LaTeX ad alta leggibilità con KaTeX.
6. **Rinforzo Positivo:** Coriandoli ed entusiasmo calibrato quando lo studente risolve correttamente un passaggio.

---

## 📚 Materie Curricolari Supportate

* 📐 **Matematica & Geometria** (dati noti, incognite, relazioni, formule KaTeX)
* 🔬 **Scienze della Terra & Biologia** (metodo sperimentale, analogie quotidiane)
* 📖 **Italiano: Grammatica & Sintassi** (analisi logica e grammaticale a domande guidate)
* ✍️ **Italiano: Temi & Scrittura** (costruzione di scalette ad albero, brainstorming, zero scrittura al posto dello studente)
* 🏛️ **Storia** (nesso causale, cause profonde vs scatenanti, linee temporali)
* 🌍 **Geografia** (territorio, clima, economia e influenza uomo-ambiente)
* 🇬🇧 **Inglese (A1-B1)** (scaffolding bilingue, role play, riflessione guidata sui verbi)
* 🇫🇷 **Francese (A1-A2)** (ausiliari essere/avere, partitivi, fonetica)
* ⚙️ **Tecnologia & Informatica** (proiezioni ortogonali, proprietà dei materiali, coding)
* 🎵 **Musica** (pentagramma, ritmi, figure e storia della musica)
* 🎨 **Arte & Immagine** (lettura visiva dell'opera, colori, luce e prospettiva)

---

## 🚀 Guida Rapida di Avvio Locale

### 1. Prerequisiti
* Node.js 20+ installato.
* Una chiave API gratuita di **Google AI Studio** (Gemini 2.5 Flash): [Ottienila qui](https://aistudio.google.com/app/apikey).

### 2. Configura l'ambiente
Copia il file delle variabili d'ambiente:
```bash
cp .env.example .env.local
```
Apri `.env.local` e inserisci la tua chiave:
```env
GOOGLE_GENERATIVE_AI_API_KEY=la_tua_chiave_gemini_qui
```

### 3. Avvia il server di sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000) sul browser del tuo computer o tablet.

---

## 🌐 Distribuzione su GitHub & Vercel (1-Click)

### 1. Invia il codice su GitHub
Crea un nuovo repository su [GitHub](https://github.com/new) (es. `ai-tutor-socratico`), poi esegui nel terminale:

```bash
git add .
git commit -m "feat: initial commit AI Socratic Tutor"
git remote add origin https://github.com/<tuo-username>/<tuo-repo>.git
git branch -M main
git push -u origin main
```

### 2. Pubblica su Vercel
1. Vai su [vercel.com](https://vercel.com) e accedi con il tuo account GitHub.
2. Clicca su **"Add New Project"** e seleziona il repository appena caricato.
3. Nella sezione **Environment Variables**, aggiungi:
   * **Key:** `GOOGLE_GENERATIVE_AI_API_KEY`
   * **Value:** *(la tua chiave API di Google AI Studio)*
4. Clicca su **Deploy**.
5. In meno di 60 secondi la web app sarà online con dominio HTTPS (es. `https://tuo-tutor.vercel.app`), pronta per essere utilizzata dai tuoi figli su PC, Mac o tablet iPad/Android!
