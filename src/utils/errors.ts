/** Turns unknown thrown values into a message safe to show in an alert. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return 'Something went wrong. Please try again.';
}

/** iOS rejects the print promise when the print sheet is dismissed. */
export function isCancellationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|dismiss/i.test(message);
}
