import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Button,
  Divider,
  Menu,
  ProgressBar,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';

import { BRAND, PAYMENT_STATUS_META } from '../../constants/theme';
import type { Invoice } from '../../types/invoice';
import {
  calculateInvoiceTotals,
  getDepositShortfall,
  getDepositStatus,
} from '../../utils/calculations';
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
import { DepositStatusBadge } from '../DepositStatusBadge';
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
  const depositStatus = getDepositStatus(
    invoice.grandTotal,
    invoice.downpaymentRequired,
    preview.amountPaid,
  );
  const depositShortfall = getDepositShortfall(invoice.downpaymentRequired, preview.amountPaid);
  const depositHint =
    depositStatus === 'paid-in-full'
      ? 'Invoice settled'
      : depositStatus === 'deposit-received'
        ? 'Booking deposit received'
        : depositStatus === 'deposit-short'
          ? `${formatPeso(depositShortfall)} still needed to confirm`
          : `${formatPeso(invoice.downpaymentRequired)} needed to confirm`;

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
    if (activeAction || savingPayment) return;
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
      <TouchableRipple
        onPress={() => setExpanded((current) => !current)}
        rippleColor="rgba(11, 107, 99, 0.08)"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} details for ${invoice.customerName}`}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.nameRow}>
              <Text style={[styles.customerName, { flex: 1 }]} numberOfLines={1}>
                {invoice.customerName}
              </Text>
              <MaterialCommunityIcons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={BRAND.muted}
                style={styles.chevron}
              />
            </View>
            <View style={styles.idRow}>
              <MaterialCommunityIcons name="receipt-text-outline" size={13} color={BRAND.muted} />
              <Text style={[styles.invoiceId, { flex: 0 }]} numberOfLines={1}>
                {invoice.id}
              </Text>
              <Text style={styles.date}>· {formatInvoiceDate(invoice.date)}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <StatusBadge status={preview.paymentStatus} compact />
            <View style={styles.balanceInline}>
              <Text style={styles.amountCaption}>Balance</Text>
              <Text style={[styles.balanceAmount, { color: statusMeta.foreground }]}>
                {formatPeso(preview.balance)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableRipple>

      {expanded ? (
        <View style={styles.body}>
          {invoice.scheduledFor ? (
            <View style={styles.jobMetaRow}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={13} color={BRAND.muted} />
              <Text style={styles.jobMeta} numberOfLines={1}>
                {invoice.scheduledFor}
              </Text>
            </View>
          ) : null}
          {invoice.serviceAddress ? (
            <View style={styles.jobMetaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={BRAND.muted} />
              <Text style={styles.jobMeta} numberOfLines={1}>
                {invoice.serviceAddress}
              </Text>
            </View>
          ) : null}
          {invoice.customerPhone ? (
            <View style={styles.jobMetaRow}>
              <MaterialCommunityIcons name="phone-outline" size={13} color={BRAND.muted} />
              <Text style={styles.jobMeta} numberOfLines={1}>
                {invoice.customerPhone}
              </Text>
            </View>
          ) : null}

      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountCaption}>Total</Text>
          <Text style={styles.totalAmount}>{formatPeso(invoice.grandTotal)}</Text>
        </View>
        <View style={styles.balanceBlock}>
          <Text style={styles.amountCaption}>Balance</Text>
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

      <View style={styles.depositRow}>
        <DepositStatusBadge status={depositStatus} compact />
        <Text style={styles.depositHint}>{depositHint}</Text>
      </View>

      <View style={styles.paidRow}>
        <View style={styles.paidInput}>
          <AmountInput
            label="Amount paid"
            value={paidText}
            onChangeText={setPaidText}
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
          <Button
            mode="contained-tonal"
            icon="content-save-check-outline"
            onPress={() => void persistPayment()}
            disabled={!isDirty || Boolean(paymentError)}
            style={styles.savePaymentButton}
            contentStyle={styles.savePaymentContent}
            accessibilityLabel="Save payment amount"
          >
            Save
          </Button>
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
        <Button
          mode="text"
          icon="share-variant-outline"
          loading={activeAction === 'share'}
          disabled={Boolean(activeAction) || savingPayment}
          onPress={() => void runInvoiceAction('share')}
          style={styles.actionButton}
          contentStyle={styles.actionContent}
        >
          Share PDF
        </Button>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="text"
              icon="dots-horizontal"
              disabled={Boolean(activeAction) || savingPayment}
              onPress={() => setMenuVisible(true)}
              style={styles.moreButton}
              contentStyle={styles.actionContent}
              accessibilityLabel="More invoice actions"
            >
              More
            </Button>
          }
        >
          <Menu.Item
            leadingIcon="image-outline"
            title="Share image"
            onPress={() => {
              setMenuVisible(false);
              void runInvoiceAction('share-image');
            }}
          />
          <Menu.Item
            leadingIcon="printer-outline"
            title="Print invoice"
            onPress={() => {
              setMenuVisible(false);
              void runInvoiceAction('print');
            }}
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete-outline"
            title="Delete invoice"
            titleStyle={styles.deleteMenuItem}
            onPress={() => {
              setMenuVisible(false);
              onDelete();
            }}
          />
        </Menu>
      </View>
        </View>
      ) : null}
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevron: {
    marginLeft: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  balanceInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  body: {
    paddingTop: 2,
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
    fontSize: 12,
    flex: 1,
  },
  date: {
    color: BRAND.muted,
    fontSize: 12,
    marginTop: 2,
  },
  jobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  jobMeta: {
    flex: 1,
    color: BRAND.muted,
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 11,
  },
  progressValue: {
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  progress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECF2EF',
  },
  depositRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
  },
  depositHint: {
    flex: 1,
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 15,
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
    borderRadius: 10,
  },
  savePaymentContent: {
    height: 42,
  },
  editServicesButton: {
    marginTop: 10,
    borderRadius: 10,
    borderColor: '#BFDCD5',
  },
  editServicesContent: {
    height: 44,
  },
  divider: {
    marginTop: 8,
    marginBottom: 2,
    backgroundColor: '#EDF2F0',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  actionButton: {
    marginLeft: -8,
  },
  actionContent: {
    height: 44,
  },
  moreButton: {
    marginRight: -8,
  },
  deleteMenuItem: {
    color: BRAND.danger,
  },
});
