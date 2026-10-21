import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BRAND } from '../constants/theme';
import {
  deleteAllInvoices,
  deleteInvoiceById,
  getInvoiceById,
  insertInvoice,
  listInvoices,
  updateInvoicePayment,
  updateInvoiceServices,
} from '../db/invoiceRepository';
import { initializeDatabase } from '../db/database';
import type { Invoice, InvoiceDraft, InvoiceService } from '../types/invoice';
import { calculateInvoiceTotals, calculateLineTotal } from '../utils/calculations';
import { createInvoiceId } from '../utils/ids';
import { applyServiceChangesToInvoice } from '../utils/invoiceUpdates';
import { roundMoney } from '../utils/money';
import {
  getDraftErrors,
  getFirstErrorMessage,
  getPaymentError,
  hasDraftErrors,
} from '../utils/validation';

interface InvoicesContextValue {
  invoices: Invoice[];
  outstandingCount: number;
  addInvoice: (draft: InvoiceDraft) => Promise<Invoice>;
  updatePayment: (id: string, amountPaid: number) => Promise<Invoice>;
  updateServices: (id: string, services: InvoiceService[]) => Promise<Invoice>;
  removeInvoice: (id: string) => Promise<void>;
  clearAllInvoices: () => Promise<void>;
  refreshInvoices: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextValue | undefined>(undefined);

function BootScreen({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <View style={styles.bootScreen}>
      <View style={styles.bootLogo}>
        <MaterialCommunityIcons
          name={error ? 'alert-circle-outline' : 'spray-bottle'}
          size={42}
          color={BRAND.primary}
        />
      </View>
      <Text variant="headlineSmall" style={styles.bootTitle}>
        Soxy Cleaning Services
      </Text>
      <Text variant="bodyMedium" style={styles.bootSubtitle}>
        {error ? 'We could not open your invoice book.' : 'Getting your invoice book ready…'}
      </Text>
      {error ? (
        <>
          <Text variant="bodySmall" style={styles.bootError} selectable>
            {error}
          </Text>
          <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
            Try again
          </Button>
        </>
      ) : (
        <ActivityIndicator color={BRAND.primary} style={styles.bootSpinner} />
      )}
    </View>
  );
}

export function InvoicesProvider({ children }: PropsWithChildren) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setBootState('loading');
    setBootError(null);

    try {
      await initializeDatabase();
      const storedInvoices = await listInvoices();
      setInvoices(storedInvoices);
      setBootState('ready');
    } catch (error) {
      console.error('Soxy: database initialization failed', error);
      setBootError(error instanceof Error ? error.message : 'Unknown database error.');
      setBootState('error');
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  const addInvoice = useCallback(async (draft: InvoiceDraft): Promise<Invoice> => {
    const normalizedDraft: InvoiceDraft = {
      customerName: draft.customerName.trim(),
      services: draft.services.map((line) => ({
        ...line,
        unitPrice: roundMoney(line.unitPrice),
        totalPrice: calculateLineTotal(line.unitPrice, line.quantity),
      })),
      transportFee: roundMoney(draft.transportFee),
      amountPaid: roundMoney(draft.amountPaid),
    };

    const errors = getDraftErrors(normalizedDraft);
    if (hasDraftErrors(errors)) {
      throw new Error(getFirstErrorMessage(errors) ?? 'Please review the invoice details.');
    }

    const totals = calculateInvoiceTotals(normalizedDraft);
    const timestamp = Date.now();
    const now = new Date(timestamp).toISOString();
    const invoice: Invoice = {
      id: createInvoiceId(timestamp),
      date: now,
      customerName: normalizedDraft.customerName,
      services: normalizedDraft.services,
      transportFee: normalizedDraft.transportFee,
      grandTotal: totals.grandTotal,
      downpaymentRequired: totals.downpaymentRequired,
      amountPaid: totals.amountPaid,
      balance: totals.balance,
      paymentStatus: totals.paymentStatus,
      createdAt: now,
      updatedAt: now,
    };

    await insertInvoice(invoice);
    setInvoices((current) => [invoice, ...current]);
    return invoice;
  }, []);

  const updatePayment = useCallback(async (id: string, amountPaid: number): Promise<Invoice> => {
    const existing = await getInvoiceById(id);
    if (!existing) {
      throw new Error('This invoice no longer exists.');
    }

    const normalizedPaid = roundMoney(amountPaid);
    const paymentError = getPaymentError(normalizedPaid, existing.grandTotal);
    if (paymentError) {
      throw new Error(paymentError);
    }

    const totals = calculateInvoiceTotals({
      services: existing.services,
      transportFee: existing.transportFee,
      amountPaid: normalizedPaid,
    });
    const updated: Invoice = {
      ...existing,
      amountPaid: totals.amountPaid,
      balance: totals.balance,
      paymentStatus: totals.paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    await updateInvoicePayment(id, {
      amountPaid: updated.amountPaid,
      balance: updated.balance,
      paymentStatus: updated.paymentStatus,
      updatedAt: updated.updatedAt,
    });
    setInvoices((current) => current.map((invoice) => (invoice.id === id ? updated : invoice)));
    return updated;
  }, []);

  const updateServices = useCallback(
    async (id: string, services: InvoiceService[]): Promise<Invoice> => {
      const existing = await getInvoiceById(id);
      if (!existing) {
        throw new Error('This invoice no longer exists.');
      }

      const updated = applyServiceChangesToInvoice(existing, services);
      await updateInvoiceServices(id, {
        services: updated.services,
        grandTotal: updated.grandTotal,
        downpaymentRequired: updated.downpaymentRequired,
        amountPaid: updated.amountPaid,
        balance: updated.balance,
        paymentStatus: updated.paymentStatus,
        updatedAt: updated.updatedAt,
      });
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === id ? updated : invoice)),
      );
      return updated;
    },
    [],
  );

  const removeInvoice = useCallback(async (id: string): Promise<void> => {
    await deleteInvoiceById(id);
    setInvoices((current) => current.filter((invoice) => invoice.id !== id));
  }, []);

  const clearAllInvoices = useCallback(async (): Promise<void> => {
    await deleteAllInvoices();
    setInvoices([]);
  }, []);

  const refreshInvoices = useCallback(async (): Promise<void> => {
    const storedInvoices = await listInvoices();
    setInvoices(storedInvoices);
  }, []);

  const outstandingCount = useMemo(
    () => invoices.filter((invoice) => invoice.paymentStatus !== 'paid').length,
    [invoices],
  );

  const contextValue = useMemo<InvoicesContextValue>(
    () => ({
      invoices,
      outstandingCount,
      addInvoice,
      updatePayment,
      updateServices,
      removeInvoice,
      clearAllInvoices,
      refreshInvoices,
    }),
    [
      invoices,
      outstandingCount,
      addInvoice,
      updatePayment,
      updateServices,
      removeInvoice,
      clearAllInvoices,
      refreshInvoices,
    ],
  );

  if (bootState !== 'ready') {
    return <BootScreen error={bootState === 'error' ? bootError : null} onRetry={() => void boot()} />;
  }

  return <InvoicesContext.Provider value={contextValue}>{children}</InvoicesContext.Provider>;
}

export function useInvoices(): InvoicesContextValue {
  const context = useContext(InvoicesContext);
  if (!context) {
    throw new Error('useInvoices must be used inside InvoicesProvider.');
  }
  return context;
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: BRAND.background,
  },
  bootLogo: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primaryLight,
    marginBottom: 20,
  },
  bootTitle: {
    color: BRAND.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  bootSubtitle: {
    color: BRAND.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  bootError: {
    color: BRAND.danger,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  bootSpinner: {
    marginTop: 28,
  },
});
