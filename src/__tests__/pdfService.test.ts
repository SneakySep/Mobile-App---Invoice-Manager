jest.mock('expo-file-system', () => {
  const target = {
    uri: 'file:///cache/soxy-invoice-inv-1.pdf',
    write: jest.fn().mockResolvedValue(undefined),
  };

  return {
    File: jest.fn(() => target),
    Paths: { cache: { uri: 'file:///cache/' } },
  };
});

jest.mock('expo-print', () => ({
  printAsync: jest.fn(),
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('../templates/invoiceHtml', () => ({
  buildInvoiceHtml: jest.fn(() => '<html></html>'),
}));

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { shareInvoicePdf } from '../services/pdfService';
import type { Invoice } from '../types/invoice';

const invoice = { id: 'INV-1' } as Invoice;
const fileMock = File as unknown as jest.Mock;

function getWrittenTarget() {
  return fileMock.mock.results[0].value as {
    uri: string;
    write: jest.Mock;
  };
}

describe('shareInvoicePdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///host-cache/Print/generated.pdf',
      numberOfPages: 1,
      base64: 'JVBERi0=',
    });
  });

  it('writes the PDF base64 into the scoped cache and shares that file', async () => {
    await shareInvoicePdf(invoice);

    expect(Print.printToFileAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        base64: true,
        width: 595,
        height: 842,
      }),
    );
    expect(fileMock).toHaveBeenCalledWith(
      Paths.cache,
      'soxy-invoice-inv-1.pdf',
    );

    const target = getWrittenTarget();
    expect(target.write).toHaveBeenCalledWith('JVBERi0=', {
      encoding: 'base64',
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(target.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share invoice INV-1',
    });
  });

  it('does not fall back to sharing the inaccessible generated file', async () => {
    await shareInvoicePdf(invoice);

    expect(Sharing.shareAsync).not.toHaveBeenCalledWith(
      'file:///host-cache/Print/generated.pdf',
      expect.anything(),
    );
  });

  it('throws when expo-print does not return base64 data', async () => {
    (Print.printToFileAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///host-cache/Print/generated.pdf',
      numberOfPages: 1,
      base64: null,
    });

    await expect(shareInvoicePdf(invoice)).rejects.toThrow(
      'Could not prepare the invoice PDF for sharing.',
    );
    expect(fileMock).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
