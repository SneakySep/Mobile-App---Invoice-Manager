import { useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Appbar, Button, Snackbar, Text } from 'react-native-paper';

import { CATALOG_SECTIONS, findCatalogItem } from '../constants/catalog';
import { BRAND } from '../constants/theme';
import { useInvoiceDraft } from '../hooks/useInvoiceDraft';
import type { RootTabParamList } from '../navigation/types';
import { useInvoices } from '../providers/InvoicesProvider';
import type { CatalogItem, PriceOption, ServiceCategoryKey } from '../types/catalog';
import type { Invoice, InvoiceService } from '../types/invoice';
import { getErrorMessage, isCancellationError } from '../utils/errors';
import {
  getDraftErrors,
  getFirstErrorMessage,
  hasDraftErrors,
} from '../utils/validation';
import { CustomerCard } from '../components/creator/CustomerCard';
import { SelectedServicesCard } from '../components/creator/SelectedServicesCard';
import { CatalogAccordion } from '../components/creator/CatalogAccordion';
import { PaymentSummaryCard } from '../components/creator/PaymentSummaryCard';
import { StickyTotalsBar } from '../components/creator/StickyTotalsBar';
import { LineItemEditorModal } from '../components/creator/LineItemEditorModal';
import { InvoiceImageShareModal } from '../components/invoices/InvoiceImageShareModal';
import { SectionCard } from '../components/SectionCard';
import { printInvoice, shareInvoicePdf } from '../services/pdfService';

type ReceiptAction = 'share' | 'share-image' | 'print';
type BusyAction = 'save' | ReceiptAction | null;

interface LineEditorState {
  item: CatalogItem;
  line: InvoiceService | null;
}

interface SnackbarState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULT_EXPANDED: Record<ServiceCategoryKey, boolean> = {
  sessions: true,
  furniture: false,
  mattresses: false,
  addons: false,
};

export function InvoiceCreatorScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { addInvoice } = useInvoices();
  const draft = useInvoiceDraft();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [showValidation, setShowValidation] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [editor, setEditor] = useState<LineEditorState | null>(null);
  const [imageInvoice, setImageInvoice] = useState<Invoice | null>(null);
  const [expanded, setExpanded] = useState<Record<ServiceCategoryKey, boolean>>(
    DEFAULT_EXPANDED,
  );

  const errors = useMemo(() => getDraftErrors(draft.draft), [draft.draft]);
  const busy = busyAction !== null;

  const selectedCounts = useMemo(() => {
    const counts: Record<ServiceCategoryKey, number> = {
      sessions: 0,
      furniture: 0,
      mattresses: 0,
      addons: 0,
    };
    draft.services.forEach((line) => {
      counts[line.category] += 1;
    });
    return counts;
  }, [draft.services]);

  const amountPaidError =
    errors.amountPaid && (showValidation || draft.amountPaidText.trim().length > 0)
      ? errors.amountPaid
      : undefined;

  const showSnackbar = (message: string, actionLabel?: string, onAction?: () => void) => {
    setSnackbar({ message, actionLabel, onAction });
  };

  const resetForm = () => {
    draft.reset();
    setShowValidation(false);
    setExpanded(DEFAULT_EXPANDED);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const validateForm = (): boolean => {
    Keyboard.dismiss();
    setShowValidation(true);
    const currentErrors = getDraftErrors(draft.draft);
    if (hasDraftErrors(currentErrors)) {
      const hasTopOfFormError = Boolean(
        currentErrors.customerName ||
          currentErrors.customerPhone ||
          currentErrors.serviceAddress ||
          currentErrors.scheduledFor ||
          currentErrors.serviceNotes ||
          currentErrors.services,
      );
      requestAnimationFrame(() => {
        if (hasTopOfFormError) {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else {
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      });
      showSnackbar(getFirstErrorMessage(currentErrors) ?? 'Please review the invoice details.');
      return false;
    }
    return true;
  };

  const viewInvoices = () => {
    navigation.navigate('Invoices');
  };

  const handleSave = async () => {
    if (busy) return;
    if (!validateForm()) return;

    setBusyAction('save');
    try {
      const invoice = await addInvoice(draft.draft);
      resetForm();
      showSnackbar(`Invoice saved for ${invoice.customerName}.`, 'VIEW', viewInvoices);
    } catch (error) {
      Alert.alert('Invoice not saved', getErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  const generateReceipt = async (invoice: Invoice, action: ReceiptAction) => {
    if (action === 'share-image') {
      setImageInvoice(invoice);
      return;
    }

    try {
      if (action === 'share') {
        await shareInvoicePdf(invoice);
      } else {
        await printInvoice(invoice);
      }
      showSnackbar('Invoice saved. Your PDF is ready.', 'VIEW', viewInvoices);
    } catch (error) {
      if (action === 'print' && isCancellationError(error)) {
        showSnackbar('Invoice saved. Printing was cancelled.', 'VIEW', viewInvoices);
        return;
      }
      Alert.alert(
        action === 'share' ? 'Invoice saved, but could not share' : 'Invoice saved, but could not print',
        getErrorMessage(error),
      );
    }
  };

  const saveThenGenerateReceipt = async (action: ReceiptAction) => {
    setBusyAction(action);
    let invoice: Invoice;
    try {
      invoice = await addInvoice(draft.draft);
      resetForm();
    } catch (error) {
      Alert.alert('Invoice not saved', getErrorMessage(error));
      setBusyAction(null);
      return;
    }

    try {
      await generateReceipt(invoice, action);
    } finally {
      setBusyAction(null);
    }
  };

  const handleReceiptAction = (action: ReceiptAction) => {
    if (busy) return;
    if (!validateForm()) return;

    Alert.alert(
      'Save invoice before continuing?',
      'Your invoice will be saved to history before the receipt is created. This keeps every receipt backed up on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save & continue',
          onPress: () => {
            void saveThenGenerateReceipt(action);
          },
        },
      ],
    );
  };

  const handleReset = () => {
    if (busy || !draft.isDirty) return;
    Keyboard.dismiss();

    Alert.alert(
      'Reset this invoice?',
      'All unsaved customer and service details will be cleared.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Reset form', style: 'destructive', onPress: resetForm },
      ],
    );
  };

  const toggleSection = (key: ServiceCategoryKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSelectCatalogItem = (item: CatalogItem) => {
    if (busy) return;
    Keyboard.dismiss();
    setEditor({ item, line: null });
  };

  const handleEditLine = (line: InvoiceService) => {
    if (busy) return;
    Keyboard.dismiss();
    const item = findCatalogItem(line.catalogId);
    if (!item) {
      showSnackbar('This service is no longer in the catalog.');
      return;
    }
    setEditor({ item, line });
  };

  const handleRemoveLine = (line: InvoiceService) => {
    if (busy) return;

    Alert.alert(
      'Remove this service?',
      `${line.name} will be removed from the unsaved invoice.`,
      [
        { text: 'Keep service', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => draft.removeService(line.id),
        },
      ],
    );
  };

  const handleEditorSubmit = (
    item: CatalogItem,
    option: PriceOption,
    quantity: number,
    unitPrice: number,
  ) => {
    if (editor?.line) {
      draft.updateService(editor.line.id, item, option, quantity, unitPrice);
    } else {
      draft.addService(item, option, quantity, unitPrice);
    }
    setEditor(null);
  };

  const handleEditorDismiss = () => {
    setEditor(null);
  };

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appBar} elevated={false}>
        <Appbar.Content
          title="New Invoice"
          titleStyle={styles.appBarTitle}
          subtitle="Soxy Cleaning Services"
          subtitleStyle={styles.appBarSubtitle}
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <CustomerCard
              value={draft.customerName}
              onChangeText={draft.setCustomerName}
              errorText={showValidation ? errors.customerName : undefined}
              customerPhone={draft.customerPhone}
              onChangeCustomerPhone={draft.setCustomerPhone}
              customerPhoneError={showValidation ? errors.customerPhone : undefined}
              serviceAddress={draft.serviceAddress}
              onChangeServiceAddress={draft.setServiceAddress}
              serviceAddressError={showValidation ? errors.serviceAddress : undefined}
              scheduledFor={draft.scheduledFor}
              onChangeScheduledFor={draft.setScheduledFor}
              scheduledForError={showValidation ? errors.scheduledFor : undefined}
              serviceNotes={draft.serviceNotes}
              onChangeServiceNotes={draft.setServiceNotes}
              serviceNotesError={showValidation ? errors.serviceNotes : undefined}
            />

            <SelectedServicesCard
              services={draft.services}
              subtotal={draft.totals.subtotal}
              onEdit={handleEditLine}
              onRemove={handleRemoveLine}
              errorText={showValidation ? errors.services : undefined}
            />

            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuEyebrow}>Service menu</Text>
                <Text style={styles.menuTitle}>Add a service</Text>
              </View>
              <View style={styles.menuHintRow}>
                <MaterialCommunityIcons name="gesture-tap" size={14} color={BRAND.muted} />
                <Text style={styles.menuHint}>Tap an item to add it</Text>
              </View>
            </View>

            {CATALOG_SECTIONS.map((section) => (
              <CatalogAccordion
                key={section.key}
                section={section}
                expanded={expanded[section.key]}
                selectedCount={selectedCounts[section.key]}
                onToggle={() => toggleSection(section.key)}
                onSelectItem={handleSelectCatalogItem}
              />
            ))}

            <PaymentSummaryCard
              transportFeeText={draft.transportFeeText}
              onChangeTransportFee={draft.setTransportFeeText}
              transportError={errors.transportFee}
              amountPaidText={draft.amountPaidText}
              onChangeAmountPaid={draft.setAmountPaidText}
              amountPaidError={amountPaidError}
              subtotal={draft.totals.subtotal}
              grandTotal={draft.totals.grandTotal}
              downpaymentRequired={draft.totals.downpaymentRequired}
              amountPaid={draft.amountPaid}
              balance={draft.totals.balance}
              paymentStatus={draft.totals.paymentStatus}
              onUseDownpayment={draft.useDownpayment}
              onUseFullPayment={draft.useFullPayment}
            />

            <SectionCard
              title="Invoice actions"
              subtitle="Saved invoices keep your receipts safe"
              icon="file-document-outline"
            >
              <View style={styles.actionRow}>
                <Button
                  mode="outlined"
                  icon="share-variant-outline"
                  onPress={() => handleReceiptAction('share')}
                  disabled={busy}
                  loading={busyAction === 'share'}
                  style={styles.actionButton}
                  contentStyle={styles.actionContent}
                >
                  Share PDF
                </Button>
                <Button
                  mode="outlined"
                  icon="image-outline"
                  onPress={() => handleReceiptAction('share-image')}
                  disabled={busy}
                  loading={busyAction === 'share-image'}
                  style={styles.actionButton}
                  contentStyle={styles.actionContent}
                >
                  Share image
                </Button>
              </View>
              <Button
                mode="outlined"
                icon="printer-outline"
                onPress={() => handleReceiptAction('print')}
                disabled={busy}
                loading={busyAction === 'print'}
                style={styles.printButton}
                contentStyle={styles.actionContent}
              >
                Print
              </Button>
              <Text style={styles.actionHelper}>
                The current invoice is saved before a receipt is generated.
              </Text>
              <Button
                mode="text"
                icon="restart"
                onPress={handleReset}
                disabled={busy || !draft.isDirty}
                textColor={BRAND.danger}
                style={styles.resetButton}
              >
                Reset form
              </Button>
            </SectionCard>

            <View style={styles.footerNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={15} color={BRAND.muted} />
              <Text style={styles.footerNoteText}>
                Stored securely on this device. Export a JSON backup from the Invoices tab anytime.
              </Text>
            </View>
          </View>
        </ScrollView>

        <StickyTotalsBar
          grandTotal={draft.totals.grandTotal}
          downpaymentRequired={draft.totals.downpaymentRequired}
          saving={busy}
          busyLabel={
            busyAction === 'share'
              ? 'Preparing PDF…'
              : busyAction === 'share-image'
                ? 'Preparing image…'
                : busyAction === 'print'
                  ? 'Preparing print…'
                  : 'Saving invoice…'
          }
          onSave={() => void handleSave()}
        />
      </KeyboardAvoidingView>

      <LineItemEditorModal
        visible={Boolean(editor)}
        item={editor?.item ?? null}
        editingLine={editor?.line ?? null}
        onDismiss={handleEditorDismiss}
        onSubmit={handleEditorSubmit}
      />

      <InvoiceImageShareModal
        invoice={imageInvoice}
        onDismiss={() => setImageInvoice(null)}
      />

      <Snackbar
        visible={Boolean(snackbar)}
        onDismiss={() => setSnackbar(null)}
        duration={4500}
        style={styles.snackbar}
        wrapperStyle={styles.snackbarWrapper}
        action={
          snackbar?.actionLabel
            ? {
                label: snackbar.actionLabel,
                onPress: () => {
                  snackbar.onAction?.();
                  setSnackbar(null);
                },
              }
            : undefined
        }
      >
        {snackbar?.message ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  flex: {
    flex: 1,
  },
  appBar: {
    backgroundColor: BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  appBarTitle: {
    color: BRAND.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appBarSubtitle: {
    color: BRAND.primary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  menuEyebrow: {
    color: BRAND.primary,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  menuTitle: {
    color: BRAND.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  menuHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  menuHint: {
    color: BRAND.muted,
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  actionButton: {
    flex: 1,
    borderRadius: 11,
  },
  printButton: {
    marginTop: 9,
    borderRadius: 11,
  },
  actionContent: {
    height: 44,
  },
  actionHelper: {
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
    marginHorizontal: 2,
  },
  resetButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: -8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  footerNoteText: {
    flex: 1,
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 15,
  },
  snackbar: {
    backgroundColor: '#1F302B',
    borderRadius: 12,
  },
  snackbarWrapper: {
    marginBottom: 120,
  },
});
