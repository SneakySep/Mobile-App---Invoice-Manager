import type { Invoice, InvoiceService, PaymentStatus } from '../types/invoice';
import { getDatabase } from './database';

interface InvoiceRow {
  id: string;
  date: string;
  customer_name: string;
  services: string;
  transport_fee: number;
  grand_total: number;
  downpayment_required: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentUpdate {
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  updatedAt: string;
}

export interface ServicesUpdate {
  services: InvoiceService[];
  grandTotal: number;
  downpaymentRequired: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  updatedAt: string;
}

function parseStoredServices(raw: string): InvoiceService[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is InvoiceService => {
      if (!entry || typeof entry !== 'object') return false;
      const line = entry as Record<string, unknown>;
      return (
        typeof line.id === 'string' &&
        typeof line.catalogId === 'string' &&
        typeof line.name === 'string' &&
        typeof line.quantity === 'number' &&
        typeof line.unitPrice === 'number' &&
        typeof line.totalPrice === 'number'
      );
    });
  } catch {
    // A malformed line-item payload should never crash the invoice list.
    console.warn('Soxy: could not parse stored invoice services.');
    return [];
  }
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return value === 'unpaid' || value === 'partial' || value === 'paid';
}

function mapRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    date: row.date,
    customerName: row.customer_name,
    services: parseStoredServices(row.services),
    transportFee: row.transport_fee,
    grandTotal: row.grand_total,
    downpaymentRequired: row.downpayment_required,
    amountPaid: row.amount_paid,
    balance: row.balance,
    paymentStatus: isPaymentStatus(row.payment_status) ? row.payment_status : 'unpaid',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listInvoices(): Promise<Invoice[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<InvoiceRow>(
    'SELECT * FROM invoices ORDER BY date DESC, created_at DESC;',
  );
  return rows.map(mapRow);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<InvoiceRow>('SELECT * FROM invoices WHERE id = ?;', [id]);
  return row ? mapRow(row) : null;
}

export async function insertInvoice(invoice: Invoice): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO invoices (
      id, date, customer_name, services, transport_fee, grand_total,
      downpayment_required, amount_paid, balance, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      invoice.id,
      invoice.date,
      invoice.customerName,
      JSON.stringify(invoice.services),
      invoice.transportFee,
      invoice.grandTotal,
      invoice.downpaymentRequired,
      invoice.amountPaid,
      invoice.balance,
      invoice.paymentStatus,
      invoice.createdAt,
      invoice.updatedAt,
    ],
  );
}

export async function updateInvoicePayment(id: string, update: PaymentUpdate): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE invoices
      SET amount_paid = ?, balance = ?, payment_status = ?, updated_at = ?
      WHERE id = ?;`,
    [update.amountPaid, update.balance, update.paymentStatus, update.updatedAt, id],
  );
}

export async function updateInvoiceServices(id: string, update: ServicesUpdate): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE invoices
      SET services = ?, grand_total = ?, downpayment_required = ?, amount_paid = ?,
          balance = ?, payment_status = ?, updated_at = ?
      WHERE id = ?;`,
    [
      JSON.stringify(update.services),
      update.grandTotal,
      update.downpaymentRequired,
      update.amountPaid,
      update.balance,
      update.paymentStatus,
      update.updatedAt,
      id,
    ],
  );
}

export async function deleteInvoiceById(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM invoices WHERE id = ?;', [id]);
}

export async function deleteAllInvoices(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM invoices;');
}
