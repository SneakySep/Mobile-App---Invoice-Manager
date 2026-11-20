import { useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, IconButton, Modal, Portal, Surface, Text } from 'react-native-paper';

import { CATALOG_SECTIONS, findCatalogItem } from '../../constants/catalog';
import { BRAND } from '../../constants/theme';
import type { CatalogItem, PriceOption, ServiceCategoryKey } from '../../types/catalog';
import type { Invoice, InvoiceService } from '../../types/invoice';
import { calculateInvoiceTotals } from '../../utils/calculations';
import { getErrorMessage } from '../../utils/errors';
import { formatPeso } from '../../utils/money';
import { addServiceToLines, updateServiceLine } from '../../utils/services';
import { getServiceEditError } from '../../utils/validation';
import { CatalogAccordion } from '../creator/CatalogAccordion';
import { LineItemEditorModal } from '../creator/LineItemEditorModal';
import { SelectedServicesCard } from '../creator/SelectedServicesCard';

interface EditInvoiceServicesModalProps {
  invoice: Invoice | null;
  onDismiss: () => void;
  onSave: (services: InvoiceService[]) => Promise<void>;
}

interface LineEditorState {
  item: CatalogItem;
  line: InvoiceService | null;
}

const DEFAULT_EXPANDED: Record<ServiceCategoryKey, boolean> = {
  sessions: true,
  furniture: false,
  mattresses: false,
  addons: false,
};

/**
 * Full-screen editor for a saved invoice's services. Service names remain tied
 * to the catalog, while quantity, tier, and unit price can be changed. All
 * totals are previewed live and the provider enforces the overpayment guard.
 */
export function EditInvoiceServicesModal({
  invoice,
  onDismiss,
  onSave,
}: EditInvoiceServicesModalProps) {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<InvoiceService[]>(() =>
    invoice ? invoice.services.map((line) => ({ ...line })) : [],
  );
  const [editor, setEditor] = useState<LineEditorState | null>(null);
  const [expanded, setExpanded] = useState<Record<ServiceCategoryKey, boolean>>(
    DEFAULT_EXPANDED,
  );
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!invoice) {
      setServices([]);
      setEditor(null);
      return;
    }

    setServices(invoice.services.map((line) => ({ ...line })));
    setEditor(null);
    setExpanded(DEFAULT_EXPANDED);
    setSaving(false);
  }, [invoice]);

  const totals = useMemo(
    () =>
      invoice
        ? calculateInvoiceTotals({
            services,
            transportFee: invoice.transportFee,
            amountPaid: invoice.amountPaid,
          })
        : null,
    [invoice, services],
  );

  const selectedCounts = useMemo(() => {
    const counts: Record<ServiceCategoryKey, number> = {
      sessions: 0,
      furniture: 0,
      mattresses: 0,
      addons: 0,
    };
    services.forEach((line) => {
      counts[line.category] += 1;
    });
    return counts;
  }, [services]);

  const isDirty = useMemo(
    () => Boolean(invoice) && JSON.stringify(services) !== JSON.stringify(invoice?.services),
    [invoice, services],
  );
  const editError = totals ? getServiceEditError(invoice?.amountPaid ?? 0, totals.grandTotal) : null;

  if (!invoice || !totals) {
    return null;
  }

  const requestDismiss = () => {
    if (saving) return;
    if (!isDirty) {
      onDismiss();
      return;
    }

    Alert.alert(
      'Discard changes?',
      'Your edits to this invoice will not be saved.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDismiss },
      ],
    );
  };

  const handleSelectCatalogItem = (item: CatalogItem) => {
    if (saving) return;
    setEditor({ item, line: null });
  };

  const handleEditLine = (line: InvoiceService) => {
    if (saving) return;
    const item = findCatalogItem(line.catalogId);
    if (!item) {
      Alert.alert(
        'Service unavailable',
        'This service is no longer in the catalog, but its saved price can still be kept.',
      );
      return;
    }
    setEditor({ item, line });
  };

  const handleEditorSubmit = (
    item: CatalogItem,
    option: PriceOption,
    quantity: number,
    unitPrice: number,
  ) => {
    if (editor?.line) {
      const lineId = editor.line.id;
      setServices((current) =>
        current.map((line) =>
          line.id === lineId
            ? updateServiceLine(line, item, option, quantity, unitPrice)
            : line,
        ),
      );
    } else {
      setServices((current) => addServiceToLines(current, item, option, quantity, unitPrice));
    }
    setEditor(null);
  };

  const requestRemove = (line: InvoiceService) => {
    if (saving) return;

    Alert.alert(
      'Remove this service?',
      `${line.name} will be removed when you save these changes.`,
      [
        { text: 'Keep service', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setServices((current) => current.filter((currentLine) => currentLine.id !== line.id));
          },
        },
      ],
    );
  };

  const toggleSection = (key: ServiceCategoryKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    if (saving || !isDirty) return;
    if (editError) {
      Alert.alert('Services not updated', editError);
      return;
    }

    setSaving(true);
    try {
      await onSave(services);
      onDismiss();
    } catch (error) {
      Alert.alert('Could not update services', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Portal>
        <Modal
          visible
          onDismiss={requestDismiss}
          dismissable={false}
          dismissableBackButton
          style={styles.modalWrapper}
          contentContainerStyle={styles.modalSurface}
        >
          <View style={styles.screen}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>EDIT INVOICE SERVICES</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {invoice.customerName}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {invoice.id}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={22}
                onPress={requestDismiss}
                disabled={saving}
                accessibilityLabel="Close service editor"
                style={styles.closeButton}
              />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.notice}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={17}
                  color={BRAND.primary}
                />
                <Text style={styles.noticeText}>
                  Change quantities, cleaning levels, and unit prices. Service names stay
                  catalog-defined, and these prices apply only to this invoice.
                </Text>
              </View>

              <SelectedServicesCard
                services={services}
                subtotal={totals.subtotal}
                onEdit={handleEditLine}
                onRemove={requestRemove}
              />

              <View style={styles.menuHeader}>
                <View>
                  <Text style={styles.menuEyebrow}>Service menu</Text>
                  <Text style={styles.menuTitle}>Add a service</Text>
                </View>
                <Text style={styles.menuHint}>Tap an item to add it</Text>
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
            </ScrollView>

            <Surface elevation={4} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              {editError ? (
                <View style={styles.warning}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={16}
                    color={BRAND.danger}
                  />
                  <Text style={styles.warningText}>{editError}</Text>
                </View>
              ) : null}

              <View style={styles.footerRow}>
                <View style={styles.footerTotals}>
                  <Text style={styles.footerLabel}>New grand total</Text>
                  <Text style={styles.footerTotal}>{formatPeso(totals.grandTotal)}</Text>
                  <Text style={styles.footerMeta}>
                    20% downpayment {formatPeso(totals.downpaymentRequired)}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  icon="content-save-check-outline"
                  onPress={() => void handleSave()}
                  loading={saving}
                  disabled={saving || Boolean(editError) || !isDirty}
                  style={styles.saveButton}
                  contentStyle={styles.saveContent}
                >
                  Save changes
                </Button>
              </View>
            </Surface>
          </View>
        </Modal>
      </Portal>

      <LineItemEditorModal
        visible={Boolean(editor)}
        item={editor?.item ?? null}
        editingLine={editor?.line ?? null}
        onDismiss={() => setEditor(null)}
        onSubmit={handleEditorSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'flex-start',
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
  },
  modalSurface: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    borderRadius: 0,
    backgroundColor: BRAND.background,
  },
  screen: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: BRAND.primary,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: BRAND.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 1,
  },
  subtitle: {
    color: BRAND.muted,
    fontSize: 10.5,
    marginTop: 1,
  },
  closeButton: {
    margin: 0,
    marginRight: -6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: BRAND.mint,
    borderWidth: 1,
    borderColor: '#CBE9E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    color: BRAND.primaryDark,
    fontSize: 10.5,
    lineHeight: 15,
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
  menuHint: {
    color: BRAND.muted,
    fontSize: 10,
    paddingBottom: 2,
  },
  footer: {
    backgroundColor: BRAND.surface,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingHorizontal: 16,
    paddingTop: 11,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F1',
    borderWidth: 1,
    borderColor: '#F4C7C2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 9,
  },
  warningText: {
    flex: 1,
    color: BRAND.danger,
    fontSize: 10.5,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerTotals: {
    flex: 1,
  },
  footerLabel: {
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  footerTotal: {
    color: BRAND.primaryDark,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 1,
  },
  footerMeta: {
    color: BRAND.muted,
    fontSize: 9.5,
    marginTop: 1,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveContent: {
    height: 46,
    paddingHorizontal: 12,
  },
});
