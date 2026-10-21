jest.mock('expo-file-system', () => {
  const target = {
    uri: 'file:///cache/soxy-invoice-inv-1.png',
    write: jest.fn().mockResolvedValue(undefined),
  };

  return {
    File: jest.fn(() => target),
    Paths: { cache: { uri: 'file:///cache/' } },
  };
});

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { shareInvoiceImage } from '../services/imageService';

const fileMock = File as unknown as jest.Mock;

function getWrittenTarget() {
  return fileMock.mock.results[0].value as {
    uri: string;
    write: jest.Mock;
  };
}

describe('shareInvoiceImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  it('writes the PNG into the scoped cache and shares it as an image', async () => {
    await shareInvoiceImage('INV-1', 'iVBORw0KGgo=');

    expect(fileMock).toHaveBeenCalledWith(
      Paths.cache,
      'soxy-invoice-inv-1.png',
    );

    const target = getWrittenTarget();
    expect(target.write).toHaveBeenCalledWith('iVBORw0KGgo=', {
      encoding: 'base64',
    });
    expect(Sharing.shareAsync).toHaveBeenCalledWith(target.uri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Share invoice INV-1',
    });
  });

  it('rejects an empty capture before touching the cache', async () => {
    await expect(shareInvoiceImage('INV-1', '')).rejects.toThrow(
      'Could not prepare the invoice image for sharing.',
    );
    expect(fileMock).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('rejects when sharing is unavailable', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await expect(shareInvoiceImage('INV-1', 'iVBORw0KGgo=')).rejects.toThrow(
      'Sharing is not available on this device.',
    );
    expect(fileMock).not.toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });
});
