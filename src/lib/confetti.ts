import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6'],
    });
  } catch (e) {
    // Graceful fallback if canvas is not supported
    console.error('Confetti error:', e);
  }
}

export function shouldCelebrate(text: string): boolean {
  const lower = text.toLowerCase();
  const celebrationKeywords = [
    'bravissimo',
    'bravissima',
    'esatto!',
    'ottimo lavoro',
    'ottima intuizione',
    'perfetto!',
    'hai centrato il punto',
    'complimenti!',
    'risolto correttamente',
  ];
  return celebrationKeywords.some((keyword) => lower.includes(keyword));
}
