import type { ServiceCategoryKey } from './catalog';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentStatusFilter = 'all' | PaymentStatus;
export type DepositStatus =
  | 'deposit-due'
  | 'deposit-short'
  | 'deposit-received'
  | 'paid-in-full';

/** A single customizable line on an invoice. */
export interface InvoiceService {
  id: string;
  catalogId: string;
  optionId: string | null;
  category: ServiceCategoryKey;
  name: string;
  /** "Standard", "Deep", or "Premium" when the catalog item is tiered. */
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  date: string;
  customerName: string;
  /** Optional job context captured when the invoice is created. */
  customerPhone?: string;
  serviceAddress?: string;
  scheduledFor?: string;
  serviceNotes?: string;
  services: InvoiceService[];
  transportFee: number;
  grandTotal: number;
  downpaymentRequired: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Values entered by the user before an invoice is saved. */
export interface InvoiceDraft {
  customerName: string;
  customerPhone?: string;
  serviceAddress?: string;
  scheduledFor?: string;
  serviceNotes?: string;
  services: InvoiceService[];
  transportFee: number;
  amountPaid: number;
}

export interface InvoiceTotals {
  subtotal: number;
  grandTotal: number;
  downpaymentRequired: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
}
