import type { InvoiceDraft } from '../types/invoice';
import {
  getDraftErrors,
  getPaymentError,
  getServiceEditError,
  getUnitPriceError,
  hasDraftErrors,
} from '../utils/validation';

function draft(overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    customerName: 'Maria Santos',
    services: [
      {
        id: 'line-1',
        catalogId: 'sofa-2-seater',
        optionId: 'standard',
        category: 'furniture',
        name: '2-Seater Sofa',
        quantity: 1,
        unitPrice: 1300,
        totalPrice: 1300,
      },
    ],
    transportFee: 0,
    amountPaid: 0,
    ...overrides,
  };
}

describe('getDraftErrors', () => {
  it('accepts a complete draft', () => {
    expect(hasDraftErrors(getDraftErrors(draft()))).toBe(false);
  });

  it('requires a customer and a priced line', () => {
    const errors = getDraftErrors(
      draft({ customerName: '   ', services: [], transportFee: 0 }),
    );
    expect(errors.customerName).toBeTruthy();
    expect(errors.services).toContain('transportation');
  });

  it('allows a transport-only invoice with a positive fee', () => {
    expect(
      hasDraftErrors(getDraftErrors(draft({ services: [], transportFee: 500 }))),
    ).toBe(false);
  });

  it('rejects overpayments and negative transport', () => {
    const errors = getDraftErrors(
      draft({ amountPaid: 2000, transportFee: -10 }),
    );
    expect(errors.amountPaid).toContain('cannot exceed');
    expect(errors.transportFee).toBeTruthy();
  });

  it('accepts a payment equal to the grand total', () => {
    expect(hasDraftErrors(getDraftErrors(draft({ amountPaid: 1300 })))).toBe(false);
  });
});

describe('getPaymentError', () => {
  it('validates the inline payment editor', () => {
    expect(getPaymentError(0, 1000)).toBeNull();
    expect(getPaymentError(1000, 1000)).toBeNull();
    expect(getPaymentError(1001, 1000)).toContain('cannot exceed');
    expect(getPaymentError(-1, 1000)).toBeTruthy();
  });
});

describe('getUnitPriceError', () => {
  it('accepts centavo prices and rejects invalid or oversized values', () => {
    expect(getUnitPriceError(0)).toBeNull();
    expect(getUnitPriceError(1099.99)).toBeNull();
    expect(getUnitPriceError(-1)).toContain('valid');
    expect(getUnitPriceError(Number.NaN)).toContain('valid');
    expect(getUnitPriceError(1_000_000)).toContain('too large');
  });
});

describe('getServiceEditError', () => {
  it('blocks a new total that is below the amount already paid', () => {
    expect(getServiceEditError(500, 500)).toBeNull();
    expect(getServiceEditError(500, 700)).toBeNull();
    expect(getServiceEditError(500, 400)).toContain('Reduce the payment first');
  });

  it('requires a positive invoice total', () => {
    expect(getServiceEditError(0, 0)).toContain('transportation fee');
  });
});
