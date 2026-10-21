import { useCallback, useMemo, useState } from 'react';

import type { CatalogItem, PriceOption } from '../types/catalog';
import type { InvoiceDraft, InvoiceService } from '../types/invoice';
import { addServiceToLines, updateServiceLine } from '../utils/services';
import {
  calculateInvoiceTotals,
  type InvoiceCalculationInput,
} from '../utils/calculations';
import {
  formatAmountForInput,
  parseMoneyInput,
  sanitizeMoneyInput,
} from '../utils/money';

/**
 * Owns everything typed into the invoice creator. The saved invoice factory in
 * InvoicesProvider revalidates and recalculates everything again before writing.
 */
export function useInvoiceDraft() {
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState<InvoiceService[]>([]);
  const [transportFeeText, setTransportFeeTextState] = useState('');
  const [amountPaidText, setAmountPaidTextState] = useState('');

  const transportFee = parseMoneyInput(transportFeeText);
  const amountPaid = parseMoneyInput(amountPaidText);

  const totals = useMemo(
    () =>
      calculateInvoiceTotals({
        services,
        transportFee,
        amountPaid,
      }),
    [services, transportFee, amountPaid],
  );

  const setTransportFeeText = useCallback((text: string) => {
    setTransportFeeTextState(sanitizeMoneyInput(text));
  }, []);

  const setAmountPaidText = useCallback((text: string) => {
    setAmountPaidTextState(sanitizeMoneyInput(text));
  }, []);

  const addService = useCallback(
    (item: CatalogItem, option: PriceOption, quantity: number, unitPrice?: number) => {
      setServices((current) => addServiceToLines(current, item, option, quantity, unitPrice));
    },
    [],
  );

  const updateService = useCallback(
    (
      lineId: string,
      item: CatalogItem,
      option: PriceOption,
      quantity: number,
      unitPrice?: number,
    ) => {
      setServices((current) =>
        current.map((line) =>
          line.id === lineId
            ? updateServiceLine(line, item, option, quantity, unitPrice)
            : line,
        ),
      );
    },
    [],
  );

  const removeService = useCallback((lineId: string) => {
    setServices((current) => current.filter((line) => line.id !== lineId));
  }, []);

  const useDownpayment = useCallback(() => {
    setAmountPaidTextState(formatAmountForInput(totals.downpaymentRequired));
  }, [totals.downpaymentRequired]);

  const useFullPayment = useCallback(() => {
    setAmountPaidTextState(formatAmountForInput(totals.grandTotal));
  }, [totals.grandTotal]);

  const reset = useCallback(() => {
    setCustomerName('');
    setServices([]);
    setTransportFeeTextState('');
    setAmountPaidTextState('');
  }, []);

  const draft = useMemo<InvoiceDraft>(
    () => ({
      customerName,
      services,
      transportFee,
      amountPaid,
    }),
    [customerName, services, transportFee, amountPaid],
  );

  const isDirty =
    customerName.trim().length > 0 ||
    services.length > 0 ||
    transportFeeText.length > 0 ||
    amountPaidText.length > 0;

  return {
    customerName,
    setCustomerName,
    services,
    addService,
    updateService,
    removeService,
    transportFeeText,
    setTransportFeeText,
    amountPaidText,
    setAmountPaidText,
    useDownpayment,
    useFullPayment,
    draft,
    totals,
    transportFee,
    amountPaid,
    reset,
    isDirty,
  };
}

export type InvoiceDraftState = ReturnType<typeof useInvoiceDraft>;
export type { InvoiceCalculationInput };
