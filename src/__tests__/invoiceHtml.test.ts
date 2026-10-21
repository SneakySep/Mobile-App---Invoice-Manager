import { buildInvoiceHtml } from '../templates/invoiceHtml';
import type { Invoice } from '../types/invoice';

const sampleInvoice: Invoice = {
  id: 'INV-SOXY-1760000000000',
  date: '2026-10-21T06:45:00.000Z',
  customerName: '<script>alert("x")</script> & Maria',
  services: [
    {
      id: 'line-1',
      catalogId: 'mattress-queen',
      optionId: 'deep',
      category: 'mattresses',
      name: 'Queen Mattress',
      variantLabel: 'Deep',
      quantity: 1,
      unitPrice: 1750,
      totalPrice: 1750,
    },
    {
      id: 'line-2',
      catalogId: 'sofa-2-seater',
      optionId: 'standard',
      category: 'furniture',
      name: '2-Seater Sofa',
      quantity: 2,
      unitPrice: 1300,
      totalPrice: 2600,
    },
  ],
  transportFee: 300,
  grandTotal: 4650,
  downpaymentRequired: 930,
  amountPaid: 930,
  balance: 3720,
  paymentStatus: 'partial',
  createdAt: '2026-10-21T06:45:00.000Z',
  updatedAt: '2026-10-21T06:45:00.000Z',
};

describe('buildInvoiceHtml', () => {
  it('produces a self-contained A4 document', () => {
    const html = buildInvoiceHtml(sampleInvoice);

    expect(html).toContain('@page');
    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('INVOICE');
    expect(html).toContain('INV-SOXY-1760000000000');
    expect(html).toContain('PARTIAL');
  });

  it('escapes customer-entered values', () => {
    const html = buildInvoiceHtml(sampleInvoice);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Maria');
  });

  it('prints the calculated totals and line-item tier', () => {
    const html = buildInvoiceHtml(sampleInvoice);

    expect(html).toContain('Queen Mattress');
    expect(html).toContain('Deep');
    expect(html).toContain('₱4,650.00');
    expect(html).toContain('₱930.00');
    expect(html).toContain('₱3,720.00');
  });

  it('uses edited per-invoice unit prices in the receipt', () => {
    const html = buildInvoiceHtml({
      ...sampleInvoice,
      services: [
        {
          ...sampleInvoice.services[1],
          unitPrice: 1150,
          totalPrice: 2300,
        },
      ],
      grandTotal: 2600,
      downpaymentRequired: 520,
      amountPaid: 520,
      balance: 2080,
    });

    expect(html).toContain('₱1,150.00');
    expect(html).toContain('₱2,300.00');
    expect(html).toContain('₱2,600.00');
  });
});
