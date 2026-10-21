import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { sanitizeFileName } from '../utils/html';

/**
 * Writes a captured invoice image into the experience-scoped cache and opens
 * the system share sheet. Capturing to base64 first avoids reading a temporary
 * file created outside the Expo Go sandbox, which would fail its READ check.
 */
export async function shareInvoiceImage(
  invoiceId: string,
  base64: string,
): Promise<void> {
  if (!base64) {
    throw new Error('Could not prepare the invoice image for sharing.');
  }

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const target = new File(
    Paths.cache,
    `soxy-invoice-${sanitizeFileName(invoiceId)}.png`,
  );
  await target.write(base64, { encoding: 'base64' });

  await Sharing.shareAsync(target.uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: `Share invoice ${invoiceId}`,
  });
}
