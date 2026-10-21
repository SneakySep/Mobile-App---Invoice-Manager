import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { BUSINESS_INFO } from '../constants/business';
import type { Invoice } from '../types/invoice';
import { formatFileTimestamp } from '../utils/date';

const BACKUP_SCHEMA_VERSION = 1;

export interface InvoiceBackup {
  app: string;
  appVersion: string;
  schemaVersion: number;
  exportedAt: string;
  invoiceCount: number;
  invoices: Invoice[];
}

export function buildBackupPayload(invoices: Invoice[]): InvoiceBackup {
  return {
    app: BUSINESS_INFO.name,
    appVersion: '1.0.0',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    invoiceCount: invoices.length,
    invoices,
  };
}

/** Writes a complete JSON backup to the cache and opens the share sheet. */
export async function exportInvoicesAsJson(invoices: Invoice[]): Promise<void> {
  if (invoices.length === 0) {
    throw new Error('There are no invoices to export yet.');
  }

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  const payload = buildBackupPayload(invoices);
  const fileName = `soxy-invoices-${formatFileTimestamp()}.json`;
  const file = new File(Paths.cache, fileName);

  if (file.exists) {
    file.delete();
  }
  file.create({ overwrite: true });
  await file.write(JSON.stringify(payload, null, 2));

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Soxy invoice data',
  });
}
