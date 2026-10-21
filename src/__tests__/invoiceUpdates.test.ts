import type { Invoice, InvoiceService } from '../types/invoice';
import { applyServiceChangesToInvoice } from '../utils/invoiceUpdates';

const originalServices: InvoiceService[] = [
  {
    id: 'line-1',
    catalogId: 'sofa-2-seater',
    optionId: 'standard',
    category: 'furniture',
    name: '2-Seater Sofa',
    quantity: 2,
    unitPrice: 1300,
    totalPrice: 2600,
  },
  {
    id: 'line-2',
    catalogId: 'mattress-queen',
    optionId: 'deep',
    category: 'mattresses',
    name: 'Queen Mattress',
    variantLabel: 'Deep',
    quantity: 1,
    unitPrice: 1750,
    totalPrice: 1750,
  },
];

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'INV-SOXY-1760000000000',
    date: '2026-10-21T06:45:00.000Z',
    customerName: 'Maria Santos',
    services: originalServices,
    transportFee: 300,
    grandTotal: 4650,
    downpaymentRequired: 930,
    amountPaid: 930,
    balance: 3720,
    paymentStatus: 'partial',
    createdAt: '2026-10-21T06:45:00.000Z',
    updatedAt: '2026-10-21T06:45:00.000Z',
    ...overrides,
  };
}

describe('applyServiceChangesToInvoice', () => {
  it('recalculates line totals, grand total, downpayment, and balance', () => {
    const updated = applyServiceChangesToInvoice(
      invoice(),
      [
        { ...originalServices[0], unitPrice: 1100, totalPrice: 9999 },
        originalServices[1],
      ],
      '2026-10-22T00:00:00.000Z',
    );

    expect(updated.services[0].unitPrice).toBe(1100);
    expect(updated.services[0].totalPrice).toBe(2200);
    expect(updated.services[1].totalPrice).toBe(1750);
    expect(updated.grandTotal).toBe(4250);
    expect(updated.downpaymentRequired).toBe(850);
    expect(updated.amountPaid).toBe(930);
    expect(updated.balance).toBe(3320);
    expect(updated.paymentStatus).toBe('partial');
    expect(updated.updatedAt).toBe('2026-10-22T00:00:00.000Z');
    expect(updated.customerName).toBe('Maria Santos');
    expect(updated.transportFee).toBe(300);
    expect(updated.date).toBe('2026-10-21T06:45:00.000Z');
    expect(updated.createdAt).toBe('2026-10-21T06:45:00.000Z');
  });

  it('updates payment status when a price increase exceeds the amount paid', () => {
    const updated = applyServiceChangesToInvoice(
      invoice({ amountPaid: 4650, balance: 0, paymentStatus: 'paid' }),
      [
        { ...originalServices[0], unitPrice: 1500, totalPrice: 3000 },
        originalServices[1],
      ],
    );

    expect(updated.grandTotal).toBe(5050);
    expect(updated.amountPaid).toBe(4650);
    expect(updated.balance).toBe(400);
    expect(updated.paymentStatus).toBe('partial');
  });

  it('rejects lowering the total below the amount already paid', () => {
    expect(() =>
      applyServiceChangesToInvoice(invoice({ amountPaid: 2000 }), [
        { ...originalServices[0], unitPrice: 500, totalPrice: 1000 },
      ]),
    ).toThrow('Reduce the payment first');
  });

  it('rejects invalid unit prices before writing anything', () => {
    expect(() =>
      applyServiceChangesToInvoice(invoice(), [
        { ...originalServices[0], unitPrice: -10, totalPrice: 0 },
      ]),
    ).toThrow('valid unit price');
  });
});
