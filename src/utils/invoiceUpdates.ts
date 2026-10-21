import type { Invoice, InvoiceService } from '../types/invoice';
import { calculateInvoiceTotals, calculateLineTotal } from './calculations';
import { roundMoney } from './money';
import { getServiceEditError, getUnitPriceError } from './validation';

/**
 * Rebuilds a saved invoice after its service lines or unit prices change.
 * Only the services and their derived totals are touched; the customer,
 * transportation fee, invoice ID, and original date stay intact.
 */
export function applyServiceChangesToInvoice(
  invoice: Invoice,
  services: InvoiceService[],
  updatedAt = new Date().toISOString(),
): Invoice {
  const normalizedServices = services.map((line) => {
    const priceError = getUnitPriceError(line.unitPrice);
    if (priceError) {
      throw new Error(`${line.name}: ${priceError}`);
    }
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      throw new Error(`${line.name}: Enter a valid quantity.`);
    }

    const unitPrice = roundMoney(line.unitPrice);
    return {
      ...line,
      unitPrice,
      totalPrice: calculateLineTotal(unitPrice, line.quantity),
    };
  });

  const totals = calculateInvoiceTotals({
    services: normalizedServices,
    transportFee: invoice.transportFee,
    amountPaid: invoice.amountPaid,
  });
  const editError = getServiceEditError(invoice.amountPaid, totals.grandTotal);
  if (editError) {
    throw new Error(editError);
  }

  return {
    ...invoice,
    services: normalizedServices,
    grandTotal: totals.grandTotal,
    downpaymentRequired: totals.downpaymentRequired,
    amountPaid: totals.amountPaid,
    balance: totals.balance,
    paymentStatus: totals.paymentStatus,
    updatedAt,
  };
}
