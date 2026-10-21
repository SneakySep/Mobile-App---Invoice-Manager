import type { ServiceCategoryKey } from './catalog';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentStatusFilter = 'all' | PaymentStatus;

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
