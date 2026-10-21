import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import type { Invoice } from '../types/invoice';
import { buildInvoiceHtml } from '../templates/invoiceHtml';
import { sanitizeFileName } from '../utils/html';

/** A4 at 72 PPI. Expo Print defaults to US Letter, so both actions set this. */
const A4_PAGE = { width: 595, height: 842 } as const;

export function createInvoicePdfHtml(invoice: Invoice): string {
  return buildInvoiceHtml(invoice);
}

/** Opens the native print dialog (AirPrint on iOS, Android print service). */
export async function printInvoice(invoice: Invoice): Promise<void> {
  await Print.printAsync({ html: createInvoicePdfHtml(invoice), ...A4_PAGE });
}

/**
 * Generates the PDF and opens the system share sheet. The PDF is written to a
 * human-readable cache filename so it looks professional when emailed or saved
 * from the share sheet.
 *
 * Expo Go keeps the PDF from `printToFileAsync` outside the experience sandbox,
 * so copying that file is rejected by expo-file-system's permission checks.
 * Requesting the PDF as base64 and writing it into `Paths.cache` avoids reading
 * the generated file while keeping the readable filename.
 */
export async function shareInvoicePdf(invoice: Invoice): Promise<void> {
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const generated = await Print.printToFileAsync({
    html: createInvoicePdfHtml(invoice),
    ...A4_PAGE,
    base64: true,
  });

  if (!generated.base64) {
    throw new Error('Could not prepare the invoice PDF for sharing.');
  }

  const target = new File(
    Paths.cache,
    `soxy-invoice-${sanitizeFileName(invoice.id)}.pdf`,
  );
  await target.write(generated.base64, { encoding: 'base64' });

  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Share invoice ${invoice.id}`,
  });
}
