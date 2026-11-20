import { StyleSheet, Text, View } from 'react-native';

import { BUSINESS_INFO } from '../../constants/business';
import { BRAND, PAYMENT_STATUS_META } from '../../constants/theme';
import type { Invoice } from '../../types/invoice';
import { getDepositShortfall, getDepositStatus } from '../../utils/calculations';
import { formatLongDateTime } from '../../utils/date';
import { formatPeso, formatQuantity, roundMoney } from '../../utils/money';

interface InvoiceImageSheetProps {
  invoice: Invoice;
}

function money(value: number): string {
  return formatPeso(value, { cents: 'always' });
}

function MetaRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[styles.metaValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function TotalRow({
  label,
  value,
  emphasis,
  highlighted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  highlighted?: boolean;
}) {
  return (
    <View
      style={[
        styles.totalRow,
        highlighted && styles.totalRowHighlighted,
        emphasis && styles.totalRowEmphasis,
      ]}
    >
      <Text style={[styles.totalLabel, emphasis && styles.totalLabelEmphasis]}>
        {label}
      </Text>
      <Text style={[styles.totalValue, emphasis && styles.totalValueEmphasis]}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Native, share-friendly version of the invoice. It is rendered at a readable
 * mobile width and can grow vertically, so every service line is included in
 * the captured PNG instead of being clipped to one screen.
 */
export function InvoiceImageSheet({ invoice }: InvoiceImageSheetProps) {
  const status = PAYMENT_STATUS_META[invoice.paymentStatus];
  const depositStatus = getDepositStatus(
    invoice.grandTotal,
    invoice.downpaymentRequired,
    invoice.amountPaid,
  );
  const depositShortfall = getDepositShortfall(
    invoice.downpaymentRequired,
    invoice.amountPaid,
  );
  const subtotal = roundMoney(
    invoice.services.reduce((sum, line) => sum + line.totalPrice, 0),
  );
  const statusMessage =
    depositStatus === 'paid-in-full'
      ? 'Payment received in full. Thank you!'
      : depositStatus === 'deposit-received'
        ? `The required 20% booking deposit has been received. The remaining balance of ${money(
            invoice.balance,
          )} is due upon completion of the service.`
        : depositStatus === 'deposit-short'
          ? `A partial payment of ${money(invoice.amountPaid)} has been received. ${money(
              depositShortfall,
            )} more is needed to confirm the booking.`
          : `A 20% downpayment of ${money(
              invoice.downpaymentRequired,
            )} is required to confirm this booking. The remaining balance is due upon completion of the service.`;

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>{BUSINESS_INFO.monogram}</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>{BUSINESS_INFO.name}</Text>
            <Text style={styles.brandTagline}>
              {BUSINESS_INFO.tagline.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.documentBlock}>
          <Text style={styles.documentType}>INVOICE</Text>
          <Text style={styles.documentId} numberOfLines={2}>
            {invoice.id}
          </Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: status.background,
                borderColor: status.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: status.foreground }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.contactRow}>
        <Text style={styles.contactText}>{BUSINESS_INFO.address}</Text>
        <Text style={styles.contactDot}>•</Text>
        <Text style={styles.contactText}>{BUSINESS_INFO.phone}</Text>
        <Text style={styles.contactDot}>•</Text>
        <Text style={styles.contactText}>{BUSINESS_INFO.email}</Text>
      </View>

      <View style={styles.headerRule} />

      <View style={styles.panel}>
        <Text style={styles.eyebrow}>BILLED TO</Text>
        <Text style={styles.customerName}>{invoice.customerName}</Text>
        <Text style={styles.customerNote}>Cleaning service invoice</Text>
      </View>

      <View style={[styles.panel, styles.metaPanel]}>
        <MetaRow label="Invoice no." value={invoice.id} />
        <MetaRow
          label="Invoice date"
          value={formatLongDateTime(invoice.date)}
        />
        <MetaRow
          label="Payment status"
          value={status.label}
          valueColor={status.foreground}
        />
        {invoice.customerPhone ? <MetaRow label="Phone" value={invoice.customerPhone} /> : null}
        {invoice.scheduledFor ? <MetaRow label="Service schedule" value={invoice.scheduledFor} /> : null}
        {invoice.serviceAddress ? (
          <MetaRow label="Service address" value={invoice.serviceAddress} />
        ) : null}
        {invoice.serviceNotes ? <MetaRow label="Service notes" value={invoice.serviceNotes} /> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SERVICES</Text>
        <Text style={styles.sectionMeta}>
          {invoice.services.length} item
          {invoice.services.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeading, styles.indexColumn]}>#</Text>
        <Text style={[styles.tableHeading, styles.descriptionColumn]}>
          DESCRIPTION
        </Text>
        <Text style={[styles.tableHeading, styles.amountColumn]}>AMOUNT</Text>
      </View>

      {invoice.services.length === 0 ? (
        <Text style={styles.emptyText}>No services were added to this invoice.</Text>
      ) : (
        invoice.services.map((line, index) => (
          <View key={line.id} style={styles.itemRow}>
            <Text style={[styles.itemIndex, styles.indexColumn]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.descriptionColumn}>
              <Text style={styles.itemName}>{line.name}</Text>
              {line.variantLabel ? (
                <Text style={styles.itemVariant}>{line.variantLabel}</Text>
              ) : null}
              <Text style={styles.itemMeta}>
                {formatQuantity(line.quantity)} × {money(line.unitPrice)}
              </Text>
            </View>
            <Text style={[styles.itemAmount, styles.amountColumn]}>
              {money(line.totalPrice)}
            </Text>
          </View>
        ))
      )}

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>PAYMENT SUMMARY</Text>
        <View style={styles.totalsCard}>
          <TotalRow label="Subtotal" value={money(subtotal)} />
          {invoice.transportFee > 0 ? (
            <TotalRow
              label="Transport fee"
              value={money(invoice.transportFee)}
            />
          ) : null}
          <TotalRow
            label="Grand total"
            value={money(invoice.grandTotal)}
            emphasis
          />
          <TotalRow
            label="20% downpayment"
            value={money(invoice.downpaymentRequired)}
            highlighted
          />
          <TotalRow label="Amount paid" value={money(invoice.amountPaid)} />
          <TotalRow
            label="Balance"
            value={money(invoice.balance)}
            emphasis
          />
        </View>
      </View>

      <View
        style={[styles.paymentNote, { borderLeftColor: status.border }]}
      >
        <Text style={styles.paymentNoteTitle}>PAYMENT NOTE</Text>
        <Text style={styles.paymentNoteText}>{statusMessage}</Text>
      </View>

      <View style={styles.signatures}>
        <View style={styles.signature}>
          <Text style={styles.signatureLabel}>PREPARED BY</Text>
          <Text style={styles.signatureName}>{BUSINESS_INFO.name}</Text>
        </View>
        <View style={styles.signature}>
          <Text style={styles.signatureLabel}>RECEIVED BY</Text>
          <Text style={styles.signatureName}>{invoice.customerName}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerThanks}>{BUSINESS_INFO.invoiceFooter}</Text>
        <Text style={styles.footerMeta}>{BUSINESS_INFO.website}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  brandBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  monogram: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
  },
  monogramText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    color: BRAND.primaryDark,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 21,
  },
  brandTagline: {
    marginTop: 2,
    color: BRAND.muted,
    fontSize: 7.5,
    fontWeight: '600',
    letterSpacing: 1.1,
    lineHeight: 11,
  },
  documentBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: 136,
  },
  documentType: {
    color: BRAND.primary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2.2,
    lineHeight: 23,
  },
  documentId: {
    marginTop: 2,
    color: BRAND.muted,
    fontSize: 8,
    textAlign: 'right',
    lineHeight: 11,
  },
  statusPill: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    marginTop: 11,
  },
  contactText: {
    color: BRAND.muted,
    fontSize: 8.5,
    lineHeight: 13,
  },
  contactDot: {
    color: '#9FB0AA',
    fontSize: 8.5,
    lineHeight: 13,
  },
  headerRule: {
    height: 2,
    marginTop: 13,
    backgroundColor: BRAND.primary,
  },
  panel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 10,
    backgroundColor: '#F7FAF8',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  metaPanel: {
    marginTop: 8,
    gap: 6,
  },
  eyebrow: {
    color: BRAND.muted,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  customerName: {
    marginTop: 3,
    color: BRAND.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  customerNote: {
    marginTop: 2,
    color: BRAND.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaLabel: {
    color: BRAND.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  metaValue: {
    flex: 1,
    color: BRAND.text,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 7,
  },
  sectionTitle: {
    color: BRAND.primaryDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionMeta: {
    color: BRAND.muted,
    fontSize: 8.5,
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  tableHeading: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  indexColumn: {
    width: 24,
  },
  descriptionColumn: {
    flex: 1,
  },
  amountColumn: {
    width: 82,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  itemIndex: {
    color: '#95A6A0',
    fontSize: 9,
    lineHeight: 14,
    paddingTop: 1,
  },
  itemName: {
    color: BRAND.text,
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
  },
  itemVariant: {
    marginTop: 1,
    color: BRAND.muted,
    fontSize: 9,
    lineHeight: 13,
  },
  itemMeta: {
    marginTop: 2,
    color: BRAND.muted,
    fontSize: 8.5,
    lineHeight: 12,
  },
  itemAmount: {
    color: BRAND.text,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    paddingTop: 1,
  },
  emptyText: {
    paddingHorizontal: 8,
    paddingVertical: 18,
    color: BRAND.muted,
    fontSize: 10,
    textAlign: 'center',
  },
  summarySection: {
    marginTop: 18,
  },
  totalsCard: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  totalRowHighlighted: {
    backgroundColor: '#FFF9EC',
  },
  totalRowEmphasis: {
    borderTopWidth: 1.5,
    borderTopColor: BRAND.primary,
    backgroundColor: '#F8FBF9',
  },
  totalLabel: {
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 14,
  },
  totalValue: {
    color: BRAND.text,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  totalLabelEmphasis: {
    color: BRAND.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  totalValueEmphasis: {
    color: BRAND.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  paymentNote: {
    marginTop: 12,
    borderLeftWidth: 3,
    backgroundColor: '#FBFDFC',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  paymentNoteTitle: {
    color: BRAND.primaryDark,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  paymentNoteText: {
    marginTop: 3,
    color: '#3D4F49',
    fontSize: 9.5,
    lineHeight: 14,
  },
  signatures: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 22,
  },
  signature: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#9FB0AA',
    paddingTop: 12,
  },
  signatureLabel: {
    color: BRAND.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.85,
  },
  signatureName: {
    marginTop: 2,
    color: BRAND.text,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 9,
  },
  footerThanks: {
    flex: 1,
    color: BRAND.primaryDark,
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 12,
  },
  footerMeta: {
    color: BRAND.primary,
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 12,
  },
});
