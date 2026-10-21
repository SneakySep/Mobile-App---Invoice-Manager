import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Appbar, Chip, Searchbar, Snackbar, Text } from 'react-native-paper';

import { BRAND } from '../constants/theme';
import type { RootTabParamList } from '../navigation/types';
import { useInvoices } from '../providers/InvoicesProvider';
import type { Invoice, PaymentStatusFilter } from '../types/invoice';
import { InvoiceCard } from '../components/invoices/InvoiceCard';
import { EditInvoiceServicesModal } from '../components/invoices/EditInvoiceServicesModal';
import { InvoiceImageShareModal } from '../components/invoices/InvoiceImageShareModal';
import { EmptyState } from '../components/EmptyState';
import { getErrorMessage } from '../utils/errors';
import { exportInvoicesAsJson } from '../services/exportService';
import { printInvoice, shareInvoicePdf } from '../services/pdfService';

const FILTERS: Array<{ key: PaymentStatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
];

export function InvoiceListScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {
    invoices,
    outstandingCount,
    updatePayment,
    updateServices,
    removeInvoice,
    clearAllInvoices,
    refreshInvoices,
  } = useInvoices();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [sharingImageInvoice, setSharingImageInvoice] = useState<Invoice | null>(null);

  const counts = useMemo(
    () => ({
      all: invoices.length,
      unpaid: invoices.filter((invoice) => invoice.paymentStatus === 'unpaid').length,
      partial: invoices.filter((invoice) => invoice.paymentStatus === 'partial').length,
      paid: invoices.filter((invoice) => invoice.paymentStatus === 'paid').length,
    }),
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === 'all' || invoice.paymentStatus === statusFilter;
      const matchesQuery =
        !query ||
        invoice.customerName.toLowerCase().includes(query) ||
        invoice.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [invoices, searchQuery, statusFilter]);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all';
  const busy = exporting || clearing;

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
  };

  const handleRefresh = async () => {
    if (busy) return;
    setRefreshing(true);
    try {
      await refreshInvoices();
    } catch (error) {
      Alert.alert('Could not refresh invoices', getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (busy || invoices.length === 0) return;

    setExporting(true);
    try {
      await exportInvoicesAsJson(invoices);
      showSnackbar('Invoice backup ready.');
    } catch (error) {
      Alert.alert('Could not export invoices', getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const performDelete = async (invoice: Invoice) => {
    try {
      await removeInvoice(invoice.id);
      showSnackbar('Invoice deleted.');
    } catch (error) {
      Alert.alert('Could not delete invoice', getErrorMessage(error));
    }
  };

  const confirmDelete = (invoice: Invoice) => {
    Alert.alert(
      'Delete this invoice?',
      `${invoice.id} for ${invoice.customerName} will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDelete(invoice);
          },
        },
      ],
    );
  };

  const performClearAll = async () => {
    setClearing(true);
    try {
      await clearAllInvoices();
      setStatusFilter('all');
      setSearchQuery('');
      showSnackbar('All invoices cleared.');
    } catch (error) {
      Alert.alert('Could not clear invoices', getErrorMessage(error));
    } finally {
      setClearing(false);
    }
  };

  const confirmClearAll = () => {
    if (busy || invoices.length === 0) return;

    Alert.alert(
      'Clear all invoices?',
      `This permanently removes ${invoices.length} saved invoice${
        invoices.length === 1 ? '' : 's'
      }. Export a JSON backup first if you may need this data later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            void performClearAll();
          },
        },
      ],
    );
  };

  const handlePaymentUpdate = async (invoice: Invoice, amountPaid: number) => {
    await updatePayment(invoice.id, amountPaid);
    showSnackbar(`Payment updated for ${invoice.customerName}.`);
  };

  const handleSaveServices = async (invoice: Invoice, services: Invoice['services']) => {
    await updateServices(invoice.id, services);
    showSnackbar(`Services and totals updated for ${invoice.customerName}.`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <InvoiceCard
      invoice={item}
      onUpdatePayment={(amountPaid) => handlePaymentUpdate(item, amountPaid)}
      onEditServices={setEditingInvoice}
      onShare={(invoice) => shareInvoicePdf(invoice)}
      onShareImage={setSharingImageInvoice}
      onPrint={(invoice) => printInvoice(invoice)}
      onDelete={() => confirmDelete(item)}
    />
  );

  const subtitle =
    invoices.length === 0
      ? 'No invoices yet'
      : `${invoices.length} saved · ${outstandingCount} outstanding`;

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appBar} elevated={false}>
        <Appbar.Content
          title="Invoices"
          titleStyle={styles.appBarTitle}
          subtitle={subtitle}
          subtitleStyle={styles.appBarSubtitle}
        />
        <Appbar.Action
          icon="database-export-outline"
          onPress={() => void handleExport()}
          disabled={busy || invoices.length === 0}
          accessibilityLabel="Export all invoice data as JSON"
        />
        <Appbar.Action
          icon="delete-sweep-outline"
          onPress={confirmClearAll}
          disabled={busy || invoices.length === 0}
          accessibilityLabel="Clear all invoices"
        />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.searchWrap}>
          <Searchbar
            placeholder="Search customer or invoice ID"
            value={searchQuery}
            onChangeText={setSearchQuery}
            elevation={0}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor={BRAND.muted}
            accessibilityLabel="Search invoices"
          />
        </View>

        <View style={styles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            keyboardShouldPersistTaps="handled"
          >
            {FILTERS.map((filter) => {
              const selected = statusFilter === filter.key;
              return (
                <Chip
                  key={filter.key}
                  selected={selected}
                  showSelectedCheck={false}
                  onPress={() => setStatusFilter(filter.key)}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}
                  textStyle={[
                    styles.filterChipText,
                    selected && styles.filterChipTextSelected,
                  ]}
                  accessibilityLabel={`Show ${filter.label.toLowerCase()} invoices`}
                >
                  {filter.label} {counts[filter.key]}
                </Chip>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={filteredInvoices}
          keyExtractor={(invoice) => invoice.id}
          renderItem={renderInvoice}
          contentContainerStyle={
            filteredInvoices.length === 0 ? styles.emptyListContent : styles.listContent
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              colors={[BRAND.primary]}
              tintColor={BRAND.primary}
            />
          }
          ListEmptyComponent={
            invoices.length === 0 ? (
              <EmptyState
                icon="receipt-text-remove-outline"
                title="No invoices yet"
                message="Create your first invoice on the spot, record the downpayment, and share a polished PDF receipt."
                actionLabel="Create your first invoice"
                onAction={() => navigation.navigate('CreateInvoice')}
              />
            ) : (
              <EmptyState
                icon="file-search-outline"
                title="No matching invoices"
                message="Try a different customer name or invoice ID, or clear the filters to see everything."
                actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            )
          }
          ListFooterComponent={
            invoices.length > 0 && filteredInvoices.length > 0 ? (
              <Text style={styles.listFooter}>
                Showing {filteredInvoices.length} of {invoices.length} invoice
                {invoices.length === 1 ? '' : 's'}
              </Text>
            ) : undefined
          }
        />
      </View>

      <EditInvoiceServicesModal
        invoice={editingInvoice}
        onDismiss={() => setEditingInvoice(null)}
        onSave={(services) =>
          editingInvoice
            ? handleSaveServices(editingInvoice, services)
            : Promise.resolve()
        }
      />

      <InvoiceImageShareModal
        invoice={sharingImageInvoice}
        onDismiss={() => setSharingImageInvoice(null)}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3500}
        style={styles.snackbar}
        wrapperStyle={styles.snackbarWrapper}
      >
        {snackbarMessage ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND.background,
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchbar: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 14,
    height: 48,
  },
  searchInput: {
    fontSize: 13.5,
    minHeight: 0,
  },
  filterWrap: {
    paddingTop: 9,
    paddingBottom: 4,
  },
  filterRow: {
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  filterChip: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 999,
  },
  filterChipSelected: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
  },
  filterChipText: {
    color: BRAND.muted,
    fontSize: 11,
    fontWeight: '600',
    marginVertical: 0,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 22,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listFooter: {
    textAlign: 'center',
    color: BRAND.muted,
    fontSize: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  snackbar: {
    backgroundColor: '#1F302B',
    borderRadius: 12,
  },
  snackbarWrapper: {
    marginBottom: 6,
  },
});
