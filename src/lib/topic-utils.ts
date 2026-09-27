/**
 * Utility per ripulire l'input descrittivo dell'argomento della verifica.
 * Rimuove eventuali richieste o menzioni esplicite del numero di domande
 * (es. "fammi 5 domande su...", "voglio 15 quesiti", "10 domande")
 * garantendo che il numero di domande rimanga esclusivamente quello selezionato
 * tramite i pulsanti preimpostati (10, 20 o 30).
 */
export function cleanTopicInput(rawTopic?: string): string {
  if (!rawTopic) return '';
  let cleaned = rawTopic.trim();

  // 1. Rimuovi frasi introduttive come "fammi un test su...", "fai una verifica di...", "vorrei un quiz su..."
  cleaned = cleaned.replace(
    /^(?:fammi|fai|genera|crea|voglio|vorrei|metti)\s+(?:un\s+|una\s+)?(?:test|verifica|quiz|serie\s+di\s+domande)?\s*(?:su|sugli|sulle|sulla|sui|sul|di|del|della|degli|delle)?\s*/gi,
    ''
  );

  // 2. Rimuovi qualsiasi menzione esplicita di numero di domande (es. "5 domande su", "15 quesiti di", "solo 8 domande")
  cleaned = cleaned.replace(
    /\b(?:fammi|fai|genera|crea|voglio|vorrei|metti|test\s+da|test\s+di|verifica\s+da|verifica\s+di|solo)?\s*\d+\s*(?:domande|domanda|quesiti|quesito|esercizi|test)\s*(?:su|sugli|sulle|sulla|sui|sul|di|del|della|degli|delle)?\b/gi,
    ' '
  );

  // 3. Rimuovi numeri isolati seguiti da domande o quesiti
  cleaned = cleaned.replace(/\b\d+\s*(?:domande|domanda|quesiti|quesito)\b/gi, ' ');

  // 4. Normalizza gli spazi
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // 5. Rimuovi eventuali preposizioni o articoli rimasti isolati all'inizio
  cleaned = cleaned.replace(/^(?:su|sugli|sulle|sulla|sui|sul|di|del|della|degli|delle|in)\s+/i, '').trim();

  return cleaned;
}
