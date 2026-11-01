import { jsonrepair } from 'jsonrepair';
import { QuizQuestion } from './types';

export function parseQuizJson<T>(rawText: string): T {
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

export function shuffleQuizOptions(questions: QuizQuestion[]): QuizQuestion[] {
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
