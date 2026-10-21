import {
  calculateInvoiceTotals,
  calculateLineTotal,
  getPaymentStatus,
} from '../utils/calculations';

const services = [{ totalPrice: 1099 }, { totalPrice: 1500 }];

describe('calculateLineTotal', () => {
  it('multiplies and rounds to centavos', () => {
    expect(calculateLineTotal(1099, 2)).toBe(2198);
    expect(calculateLineTotal(200, 0.5)).toBe(100);
    expect(calculateLineTotal(0.1, 3)).toBe(0.3);
  });

  it('protects against negative or invalid values', () => {
    expect(calculateLineTotal(-100, 2)).toBe(0);
    expect(calculateLineTotal(100, Number.NaN)).toBe(0);
  });
});

describe('calculateInvoiceTotals', () => {
  it('adds services and transport, then computes the 20% downpayment', () => {
    const totals = calculateInvoiceTotals({
      services,
      transportFee: 200,
      amountPaid: 0,
    });

    expect(totals).toEqual({
      subtotal: 2599,
      grandTotal: 2799,
      downpaymentRequired: 559.8,
      amountPaid: 0,
      balance: 2799,
      paymentStatus: 'unpaid',
    });
  });

  it('tracks partial and full payments', () => {
    const partial = calculateInvoiceTotals({
      services,
      transportFee: 0,
      amountPaid: 559.8,
    });
    expect(partial.paymentStatus).toBe('partial');
    expect(partial.balance).toBe(2039.2);

    const paid = calculateInvoiceTotals({
      services,
      transportFee: 0,
      amountPaid: 2599,
    });
    expect(paid.paymentStatus).toBe('paid');
    expect(paid.balance).toBe(0);
  });

  it('clamps displayed payments to the grand total', () => {
    const totals = calculateInvoiceTotals({
      services,
      transportFee: 0,
      amountPaid: 5000,
    });

    expect(totals.amountPaid).toBe(2599);
    expect(totals.balance).toBe(0);
    expect(totals.paymentStatus).toBe('paid');
  });

  it('ignores malformed negative service totals', () => {
    const totals = calculateInvoiceTotals({
      services: [{ totalPrice: -100 }],
      transportFee: 100,
      amountPaid: 0,
    });

    expect(totals.subtotal).toBe(0);
    expect(totals.grandTotal).toBe(100);
  });
});

describe('getPaymentStatus', () => {
  it('uses cent-accurate thresholds', () => {
    expect(getPaymentStatus(100, 0)).toBe('unpaid');
    expect(getPaymentStatus(100, 0.01)).toBe('partial');
    expect(getPaymentStatus(100, 99.99)).toBe('partial');
    expect(getPaymentStatus(100, 100)).toBe('paid');
  });
});
