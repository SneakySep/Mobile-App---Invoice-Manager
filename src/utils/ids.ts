function randomToken(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Invoice IDs follow the existing web app's convention: INV-SOXY-<timestamp>. */
export function createInvoiceId(timestamp = Date.now()): string {
  return `INV-SOXY-${timestamp}`;
}

/** IDs are only needed for reliable list keys and line editing. */
export function createLineId(): string {
  return `line-${Date.now().toString(36)}-${randomToken()}`;
}
