import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  ProgressBar,
  Surface,
  Text,
} from 'react-native-paper';

import { BRAND, PAYMENT_STATUS_META } from '../../constants/theme';
import type { Invoice } from '../../types/invoice';
import { calculateInvoiceTotals } from '../../utils/calculations';
import { formatInvoiceDate } from '../../utils/date';
import { getErrorMessage, isCancellationError } from '../../utils/errors';
import {
  formatAmountForInput,
  formatPeso,
  parseMoneyInput,
  toCents,
} from '../../utils/money';
import { getPaymentError } from '../../utils/validation';
import { AmountInput } from '../AmountInput';
import { StatusBadge } from '../StatusBadge';

type InvoiceAction = 'share' | 'share-image' | 'print';

interface InvoiceCardProps {
  invoice: Invoice;
  onUpdatePayment: (amountPaid: number) => Promise<void>;
  onEditServices: (invoice: Invoice) => void;
  onShare: (invoice: Invoice) => Promise<void>;
  onShareImage: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => Promise<void>;
  onDelete: () => void;
}

export function InvoiceCard({
  invoice,
  onUpdatePayment,
  onEditServices,
  onShare,
  onShareImage,
  onPrint,
  onDelete,
}: InvoiceCardProps) {
  const [paidText, setPaidText] = useState(() => formatAmountForInput(invoice.amountPaid));
  const [savingPayment, setSavingPayment] = useState(false);
  const [activeAction, setActiveAction] = useState<InvoiceAction | null>(null);
  const paymentPromiseRef = useRef<Promise<Invoice | null> | null>(null);

  useEffect(() => {
    setPaidText(formatAmountForInput(invoice.amountPaid));
  }, [invoice.amountPaid]);

  const parsedPaid = parseMoneyInput(paidText);
  const paymentError = getPaymentError(parsedPaid, invoice.grandTotal);
  const preview = calculateInvoiceTotals({
    services: invoice.services,
    transportFee: invoice.transportFee,
    amountPaid: parsedPaid,
  });
  const statusMeta = PAYMENT_STATUS_META[preview.paymentStatus];
  const isDirty = toCents(parsedPaid) !== toCents(invoice.amountPaid);
  const progress =
    invoice.grandTotal > 0
      ? Math.min(1, Math.max(0, preview.amountPaid / invoice.grandTotal))
      : 0;

  const persistPayment = useCallback(async (): Promise<Invoice | null> => {
    if (paymentPromiseRef.current) {
      return paymentPromiseRef.current;
    }

    const value = parseMoneyInput(paidText);
    const error = getPaymentError(value, invoice.grandTotal);
    if (error) return null;

    if (toCents(value) === toCents(invoice.amountPaid)) {
      setPaidText(formatAmountForInput(invoice.amountPaid));
      return invoice;
    }

    const operation = (async () => {
      setSavingPayment(true);
      try {
        await onUpdatePayment(value);
        const updatedTotals = calculateInvoiceTotals({
          services: invoice.services,
          transportFee: invoice.transportFee,
          amountPaid: value,
        });
        return {
          ...invoice,
          amountPaid: updatedTotals.amountPaid,
          balance: updatedTotals.balance,
          paymentStatus: updatedTotals.paymentStatus,
          updatedAt: new Date().toISOString(),
        };
      } catch (saveError) {
        setPaidText(formatAmountForInput(invoice.amountPaid));
        Alert.alert('Payment not updated', getErrorMessage(saveError));
        return null;
      } finally {
        setSavingPayment(false);
      }
    })();

    paymentPromiseRef.current = operation;
    try {
      return await operation;
    } finally {
      paymentPromiseRef.current = null;
    }
  }, [invoice, onUpdatePayment, paidText]);

  const openServicesEditor = async () => {
    if (activeAction || savingPayment) return;

    let latestInvoice = invoice;

    // Do not let an unsaved inline payment edit be overwritten by a later
    // services update. Persist it first, then open the editor with that snapshot.
    if (isDirty) {
      const savedInvoice = await persistPayment();
      if (!savedInvoice) {
        if (paymentError) {
          Alert.alert('Check the amount paid', paymentError);
        }
        return;
      }
      latestInvoice = savedInvoice;
    }

    onEditServices(latestInvoice);
  };

  const runInvoiceAction = async (action: InvoiceAction) => {
    setActiveAction(action);
    try {
      let latestInvoice = invoice;

      // If the payment field was just edited, wait for it to save before
      // generating a receipt so the PDF or image reflects the current balance.
      if (isDirty) {
        const savedInvoice = await persistPayment();
        if (!savedInvoice) {
          if (paymentError) {
            Alert.alert('Check the amount paid', paymentError);
          }
          return;
        }
        latestInvoice = savedInvoice;
      }

      if (action === 'share-image') {
        onShareImage(latestInvoice);
        return;
      }

      await (action === 'share' ? onShare(latestInvoice) : onPrint(latestInvoice));
    } catch (pdfError) {
      if (action === 'print' && isCancellationError(pdfError)) {
        return;
      }
      Alert.alert(
        action === 'share'
          ? 'Could not share invoice'
          : action === 'share-image'
            ? 'Could not prepare invoice image'
            : 'Could not print invoice',
        getErrorMessage(pdfError),
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.topRow}>
        <View style={styles.customerCopy}>
          <Text style={styles.customerName} numberOfLines={2}>
            {invoice.customerName}
          </Text>
          <View style={styles.idRow}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={13}
              color={BRAND.muted}
            />
            <Text style={styles.invoiceId} numberOfLines={1}>
              {invoice.id}
            </Text>
          </View>
          <Text style={styles.date}>{formatInvoiceDate(invoice.date)}</Text>
        </View>
        <StatusBadge status={preview.paymentStatus} />
      </View>

      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountCaption}>TOTAL</Text>
          <Text style={styles.totalAmount}>{formatPeso(invoice.grandTotal)}</Text>
        </View>
        <View style={styles.balanceBlock}>
          <Text style={styles.amountCaption}>BALANCE</Text>
          <Text style={[styles.balanceAmount, { color: statusMeta.foreground }]}>
            {formatPeso(preview.balance)}
          </Text>
        </View>
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Payment progress</Text>
        <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
      </View>
      <ProgressBar
        progress={progress}
        color={statusMeta.foreground}
        style={styles.progress}
        accessibilityLabel={`Payment progress ${Math.round(progress * 100)} percent`}
      />

      <View style={styles.paidRow}>
        <View style={styles.paidInput}>
          <AmountInput
            label="Amount paid"
            value={paidText}
            onChangeText={setPaidText}
            onBlur={() => void persistPayment()}
            onSubmitEditing={() => void persistPayment()}
            compact
            errorText={paymentError}
            accessibilityLabel={`Amount paid for ${invoice.customerName}'s invoice`}
          />
        </View>
        {savingPayment ? (
          <View style={styles.savingIcon}>
            <ActivityIndicator size={18} color={BRAND.primary} />
          </View>
        ) : (
          <IconButton
            icon="content-save-check-outline"
            mode="contained-tonal"
            size={18}
            onPress={() => void persistPayment()}
            disabled={!isDirty || Boolean(paymentError)}
            style={styles.savePaymentButton}
            accessibilityLabel="Save payment amount"
          />
        )}
      </View>

      <Button
        mode="outlined"
        icon="pencil-outline"
        compact
        onPress={() => void openServicesEditor()}
        disabled={Boolean(activeAction) || savingPayment}
        style={styles.editServicesButton}
        contentStyle={styles.editServicesContent}
      >
        Edit services
      </Button>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <Button
            mode="text"
            icon="share-variant-outline"
            compact
            loading={activeAction === 'share'}
            disabled={Boolean(activeAction)}
            onPress={() => void runInvoiceAction('share')}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Share PDF
          </Button>
          <Button
            mode="text"
            icon="image-outline"
            compact
            loading={activeAction === 'share-image'}
            disabled={Boolean(activeAction)}
            onPress={() => void runInvoiceAction('share-image')}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Share image
          </Button>
        </View>
        <View style={styles.actionRow}>
          <Button
            mode="text"
            icon="printer-outline"
            compact
            loading={activeAction === 'print'}
            disabled={Boolean(activeAction)}
            onPress={() => void runInvoiceAction('print')}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Print
          </Button>
          <Button
            mode="text"
            icon="delete-outline"
            compact
            textColor={BRAND.danger}
            disabled={Boolean(activeAction) || savingPayment}
            onPress={onDelete}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Delete
          </Button>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 15,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  customerCopy: {
    flex: 1,
  },
  customerName: {
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  invoiceId: {
    color: BRAND.muted,
    fontSize: 10.5,
    flex: 1,
  },
  date: {
    color: BRAND.muted,
    fontSize: 10.5,
    marginTop: 2,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginTop: 13,
    gap: 12,
  },
  amountCaption: {
    color: BRAND.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  totalAmount: {
    color: BRAND.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  balanceBlock: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  progressLabel: {
    color: BRAND.muted,
    fontSize: 10,
  },
  progressValue: {
    color: BRAND.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  progress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECF2EF',
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  paidInput: {
    flex: 1,
  },
  savingIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePaymentButton: {
    margin: 0,
  },
  editServicesButton: {
    marginTop: 10,
    borderRadius: 10,
    borderColor: '#BFDCD5',
  },
  editServicesContent: {
    height: 38,
  },
  divider: {
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#EDF2F0',
  },
  actions: {
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -5,
  },
  actionButton: {
    flex: 1,
  },
  actionContent: {
    height: 36,
    paddingHorizontal: 2,
  },
});
