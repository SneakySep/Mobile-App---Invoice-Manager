import { BUSINESS_INFO } from '../constants/business';
import { PAYMENT_STATUS_META } from '../constants/theme';
import type { Invoice } from '../types/invoice';
import { formatLongDateTime } from '../utils/date';
import { escapeHtml } from '../utils/html';
import { formatPeso, roundMoney } from '../utils/money';

type BusinessInfo = typeof BUSINESS_INFO;

function money(value: number): string {
  return formatPeso(value, { cents: 'always' });
}

/**
 * Builds the self-contained print document used by expo-print.
 * Everything is inlined so the receipt renders offline on both platforms.
 */
export function buildInvoiceHtml(
  invoice: Invoice,
  business: BusinessInfo = BUSINESS_INFO,
): string {
  const status = PAYMENT_STATUS_META[invoice.paymentStatus];
  const customer = escapeHtml(invoice.customerName);
  const invoiceId = escapeHtml(invoice.id);
  const servicesSubtotal = roundMoney(
    invoice.services.reduce((sum, line) => sum + line.totalPrice, 0),
  );
  const itemRows = invoice.services
    .map((line, index) => {
      const variant = line.variantLabel
        ? `<div class="item-variant">${escapeHtml(line.variantLabel)}</div>`
        : '';
      return `
        <tr>
          <td class="cell-index">${String(index + 1).padStart(2, '0')}</td>
          <td class="cell-description">
            <div class="item-name">${escapeHtml(line.name)}</div>
            ${variant}
          </td>
          <td class="cell-qty">${escapeHtml(line.quantity)}</td>
          <td class="cell-money">${money(line.unitPrice)}</td>
          <td class="cell-money cell-amount">${money(line.totalPrice)}</td>
        </tr>`;
    })
    .join('');

  const emptyRow = `
    <tr>
      <td colspan="5" class="empty-row">No services were added to this invoice.</td>
    </tr>`;

  const statusMessage =
    invoice.paymentStatus === 'paid'
      ? 'Payment received in full. Thank you!'
      : invoice.paymentStatus === 'partial'
        ? `A partial payment of ${money(invoice.amountPaid)} has been received. The remaining balance of ${money(
            invoice.balance,
          )} is due upon completion of the service.`
        : `A 20% downpayment of ${money(
            invoice.downpaymentRequired,
          )} is required to confirm this booking. The remaining balance is due upon completion of the service.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${invoiceId} — Soxy Cleaning Services</title>
  <style>
    :root {
      --ink: #172622;
      --muted: #5e706b;
      --line: #dce6e2;
      --teal: #0b6b63;
      --teal-dark: #054b46;
      --teal-soft: #e7f6f2;
      --paper: #ffffff;
      --status-bg: ${status.background};
      --status-ink: ${status.foreground};
      --status-line: ${status.border};
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: var(--ink); }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    .sheet {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      /* Percentage padding keeps A4 margins consistent even when the print
         engine ignores @page margins (notably WKWebView on iOS). */
      padding: 5.7% 6.2% 5.2%;
    }

    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      padding-bottom: 14px;
      border-bottom: 2px solid var(--teal);
    }

    .brand { display: flex; align-items: center; gap: 10px; }
    .monogram {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      background: var(--teal);
      color: #ffffff;
      text-align: center;
      font-size: 23px;
      font-weight: 800;
      line-height: 42px;
      letter-spacing: -1px;
    }
    .brand-name { margin: 0; color: var(--teal-dark); font-size: 19px; font-weight: 800; letter-spacing: -0.4px; }
    .brand-tagline { margin: 1px 0 0; color: var(--muted); font-size: 9px; letter-spacing: 1.25px; text-transform: uppercase; }

    .document { text-align: right; min-width: 160px; flex-shrink: 0; }
    .document-type { color: var(--teal); font-size: 22px; font-weight: 800; letter-spacing: 2.6px; line-height: 1.1; }
    .document-caption { color: var(--muted); font-size: 9.5px; margin-top: 3px; white-space: nowrap; }
    .status-pill {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 9px;
      border: 1px solid var(--status-line);
      border-radius: 999px;
      background: var(--status-bg);
      color: var(--status-ink);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 1.1px;
    }

    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 12px;
      margin-top: 8px;
      color: var(--muted);
      font-size: 9px;
    }
    .contact span + span::before { content: "•"; margin-right: 12px; color: #9fb0aa; }

    .meta-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 16px;
      margin-top: 14px;
    }

    .panel {
      background: #f7faf8;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 11px 14px;
    }
    .eyebrow {
      color: var(--muted);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .customer { font-size: 15px; font-weight: 700; line-height: 1.35; }
    .customer-note { margin-top: 2px; color: var(--muted); font-size: 9.5px; }

    .invoice-meta { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 11px 14px; }
    .meta-line { display: flex; justify-content: space-between; gap: 10px; }
    .meta-line span { color: var(--muted); font-size: 9.5px; white-space: nowrap; }
    .meta-line strong { font-size: 9.5px; text-align: right; white-space: nowrap; }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 16px 0 7px;
      color: var(--teal-dark);
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 1.15px;
      text-transform: uppercase;
    }
    .section-title span { color: var(--muted); font-size: 8.5px; font-weight: 600; letter-spacing: 0; text-transform: none; }

    table.items { width: 100%; border-collapse: collapse; }
    table.items thead { display: table-header-group; }
    table.items tr { page-break-inside: avoid; }
    table.items th {
      padding: 7px 7px;
      background: var(--teal);
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.65px;
      text-transform: uppercase;
      text-align: left;
    }
    table.items th:first-child { border-radius: 8px 0 0 0; }
    table.items th:last-child { border-radius: 0 8px 0 0; }
    table.items td { padding: 8px 7px; border-bottom: 1px solid var(--line); vertical-align: top; }
    table.items th.cell-money, table.items td.cell-money { text-align: right; }
    table.items th.cell-index { width: 7%; }
    table.items th.cell-description { width: 47%; }
    table.items th.cell-qty { width: 9%; text-align: center; }
    table.items th.cell-money { width: 18%; }
    table.items td.cell-qty { text-align: center; }
    table.items td.cell-index { color: #95a6a0; font-size: 9.5px; }
    .item-name { font-weight: 700; }
    .item-variant { margin-top: 1px; color: var(--muted); font-size: 9.5px; }
    .cell-amount { font-weight: 700; white-space: nowrap; }
    .empty-row { text-align: center; color: var(--muted); padding: 20px 8px !important; }

    .summary-grid {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      gap: 18px;
      margin-top: 14px;
      page-break-inside: avoid;
    }

    .notes { padding-top: 2px; }
    .notes h3, .payment-note h3 {
      margin: 0 0 5px;
      color: var(--teal-dark);
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .notes p { margin: 0 0 7px; color: var(--muted); font-size: 9.5px; line-height: 1.55; }
    .payment-note {
      margin-top: 8px;
      border-left: 3px solid var(--status-line);
      background: #fbfdfc;
      padding: 8px 10px;
      color: #3d4f49;
      font-size: 9.5px;
      line-height: 1.55;
    }

    .totals { width: 100%; border-collapse: collapse; }
    .totals td { padding: 5px 0; border-bottom: 1px solid #edf2f0; font-size: 10.5px; }
    .totals tr:last-child td { border-bottom: 0; }
    .totals .label { color: var(--muted); }
    .totals .value { text-align: right; font-weight: 600; white-space: nowrap; }
    .totals .grand td {
      padding-top: 8px;
      padding-bottom: 8px;
      border-top: 2px solid var(--teal);
      border-bottom: 1px solid var(--line);
      color: var(--teal-dark);
      font-size: 13px;
      font-weight: 800;
    }
    .totals .downpayment td { color: #8a5a00; background: #fff9ec; padding-left: 8px; padding-right: 8px; }
    .totals .paid td { color: #166534; }
    .totals .balance td {
      padding-top: 8px;
      color: var(--teal-dark);
      font-size: 12px;
      font-weight: 800;
      border-top: 1px solid var(--line);
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signature { padding-top: 16px; border-top: 1px solid #9fb0aa; }
    .signature-label { color: var(--muted); font-size: 8.5px; letter-spacing: 0.85px; text-transform: uppercase; }
    .signature-name { margin-top: 2px; font-size: 9.5px; font-weight: 600; }

    .footer {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 8.5px;
      page-break-inside: avoid;
    }
    .footer strong { color: var(--teal); }
    .footer .thanks { color: var(--teal-dark); font-weight: 700; }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="top">
      <div>
        <div class="brand">
          <div class="monogram">${escapeHtml(business.monogram)}</div>
          <div>
            <h1 class="brand-name">${escapeHtml(business.name)}</h1>
            <p class="brand-tagline">${escapeHtml(business.tagline)}</p>
          </div>
        </div>
        <div class="contact">
          <span>${escapeHtml(business.address)}</span>
          <span>${escapeHtml(business.phone)}</span>
          <span>${escapeHtml(business.email)}</span>
        </div>
      </div>
      <div class="document">
        <div class="document-type">INVOICE</div>
        <div class="document-caption">${escapeHtml(invoice.id)}</div>
        <div class="status-pill">${escapeHtml(status.label)}</div>
      </div>
    </header>

    <section class="meta-grid">
      <div class="panel">
        <div class="eyebrow">Billed to</div>
        <div class="customer">${customer}</div>
        <div class="customer-note">Cleaning service invoice</div>
      </div>
      <div class="panel invoice-meta">
        <div class="meta-line"><span>Invoice no.</span><strong>${invoiceId}</strong></div>
        <div class="meta-line"><span>Invoice date</span><strong>${escapeHtml(formatLongDateTime(invoice.date))}</strong></div>
        <div class="meta-line"><span>Payment status</span><strong style="color:${status.foreground}">${escapeHtml(status.label)}</strong></div>
      </div>
    </section>

    <div class="section-title">
      <div>Services</div>
      <span>${invoice.services.length} item${invoice.services.length === 1 ? '' : 's'}</span>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="cell-index">#</th>
          <th class="cell-description">Description</th>
          <th class="cell-qty">Qty</th>
          <th class="cell-money">Unit price</th>
          <th class="cell-money">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || emptyRow}
      </tbody>
    </table>

    <section class="summary-grid">
      <div class="notes">
        <h3>Payment terms</h3>
        <p>${escapeHtml(business.paymentTerms)}</p>
        <div class="payment-note">
          <h3>Payment note</h3>
          <div>${escapeHtml(statusMessage)}</div>
        </div>
      </div>

      <div>
        <table class="totals">
          <tr>
            <td class="label">Services subtotal</td>
            <td class="value">${money(servicesSubtotal)}</td>
          </tr>
          <tr>
            <td class="label">Transportation fee</td>
            <td class="value">${money(invoice.transportFee)}</td>
          </tr>
          <tr class="grand">
            <td>Grand total</td>
            <td class="value">${money(invoice.grandTotal)}</td>
          </tr>
          <tr class="downpayment">
            <td class="label">20% downpayment required</td>
            <td class="value">${money(invoice.downpaymentRequired)}</td>
          </tr>
          <tr class="paid">
            <td class="label">Amount paid</td>
            <td class="value">${money(invoice.amountPaid)}</td>
          </tr>
          <tr class="balance">
            <td>Balance due</td>
            <td class="value">${money(invoice.balance)}</td>
          </tr>
        </table>
      </div>
    </section>

    <section class="signatures">
      <div class="signature">
        <div class="signature-label">Prepared by</div>
        <div class="signature-name">${escapeHtml(business.name)}</div>
      </div>
      <div class="signature">
        <div class="signature-label">Received by</div>
        <div class="signature-name">Customer signature</div>
      </div>
    </section>

    <footer class="footer">
      <div class="thanks">${escapeHtml(business.invoiceFooter)}</div>
      <div><strong>${escapeHtml(business.name)}</strong> · ${escapeHtml(business.website)}</div>
    </footer>
  </main>
</body>
</html>`;
}
