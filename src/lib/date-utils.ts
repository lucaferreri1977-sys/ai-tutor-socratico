/**
 * Utility per la formattazione coerente di date e ore in italiano
 * per lo storico delle chat e delle verifiche con Socrate.
 */

export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  options?: {
    showYear?: boolean;
  }
): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    ...(options?.showYear !== false ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
