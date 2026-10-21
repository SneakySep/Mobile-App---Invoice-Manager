import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, Divider, Text } from 'react-native-paper';

import { BRAND } from '../../constants/theme';
import type { PaymentStatus } from '../../types/invoice';
import { formatPeso } from '../../utils/money';
import { AmountInput } from '../AmountInput';
import { SectionCard } from '../SectionCard';
import { StatusBadge } from '../StatusBadge';

interface PaymentSummaryCardProps {
  transportFeeText: string;
  onChangeTransportFee: (value: string) => void;
  transportError?: string;
  amountPaidText: string;
  onChangeAmountPaid: (value: string) => void;
  amountPaidError?: string;
  subtotal: number;
  grandTotal: number;
  downpaymentRequired: number;
  balance: number;
  paymentStatus: PaymentStatus;
  onUseDownpayment: () => void;
  onUseFullPayment: () => void;
}

export function PaymentSummaryCard({
  transportFeeText,
  onChangeTransportFee,
  transportError,
  amountPaidText,
  onChangeAmountPaid,
  amountPaidError,
  subtotal,
  grandTotal,
  downpaymentRequired,
  balance,
  paymentStatus,
  onUseDownpayment,
  onUseFullPayment,
}: PaymentSummaryCardProps) {
  return (
    <SectionCard
      title="Totals & payment"
      subtitle="Everything updates as you type"
      icon="calculator-variant-outline"
      right={<StatusBadge status={paymentStatus} compact />}
    >
      <View style={styles.transportRow}>
        <View style={styles.transportCopy}>
          <Text style={styles.rowLabel}>Transportation fee</Text>
          <Text style={styles.rowHint}>Optional</Text>
        </View>
        <View style={styles.transportInput}>
          <AmountInput
            value={transportFeeText}
            onChangeText={onChangeTransportFee}
            placeholder="0"
            compact
            errorText={transportError}
            accessibilityLabel="Transportation fee"
          />
        </View>
      </View>

      <View style={styles.subtotalRow}>
        <Text style={styles.rowLabel}>Services subtotal</Text>
        <Text style={styles.subtotalValue}>{formatPeso(subtotal)}</Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>Grand total</Text>
        <Text style={styles.grandValue}>{formatPeso(grandTotal)}</Text>
      </View>

      <View style={styles.downpaymentBox}>
        <View style={styles.downpaymentIcon}>
          <MaterialCommunityIcons name="wallet-outline" size={20} color="#8A5A00" />
        </View>
        <View style={styles.downpaymentCopy}>
          <Text style={styles.downpaymentLabel}>20% downpayment required</Text>
          <Text style={styles.downpaymentHint}>Include transportation in the total.</Text>
        </View>
        <Text style={styles.downpaymentValue}>{formatPeso(downpaymentRequired)}</Text>
      </View>

      <View style={styles.paidHeader}>
        <Text style={styles.sectionLabel}>Payment received</Text>
        <Text style={styles.optionalLabel}>Optional</Text>
      </View>

      <AmountInput
        label="Amount paid"
        value={amountPaidText}
        onChangeText={onChangeAmountPaid}
        placeholder="0.00"
        errorText={amountPaidError}
        helperText="Leave blank if nothing has been paid yet."
        accessibilityLabel="Amount paid"
      />

      <View style={styles.quickRow}>
        <Chip
          icon="percent-outline"
          compact
          onPress={onUseDownpayment}
          style={styles.quickChip}
          textStyle={styles.quickChipText}
          accessibilityLabel="Use the 20 percent downpayment amount"
        >
          Use 20% downpayment
        </Chip>
        <Chip
          icon="check-all"
          compact
          onPress={onUseFullPayment}
          style={styles.quickChip}
          textStyle={styles.quickChipText}
          accessibilityLabel="Mark the invoice as paid in full"
        >
          Paid in full
        </Chip>
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceCopy}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceHint}>Grand total minus amount paid</Text>
        </View>
        <Text style={styles.balanceValue}>{formatPeso(balance)}</Text>
      </View>

      <View style={styles.helper}>
        <MaterialCommunityIcons
          name="information-outline"
          size={15}
          color={BRAND.muted}
        />
        <Text style={styles.helperText}>
          A 20% deposit is required to confirm the booking. Enter what the customer has
          actually paid and the status updates automatically.
        </Text>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  transportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  transportCopy: {
    paddingTop: 8,
    flex: 1,
  },
  transportInput: {
    width: 142,
  },
  rowLabel: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '600',
  },
  rowHint: {
    color: BRAND.muted,
    fontSize: 10.5,
    marginTop: 1,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
  },
  subtotalValue: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    marginTop: 13,
    marginBottom: 12,
    backgroundColor: BRAND.border,
  },
  grandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandLabel: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: '800',
  },
  grandValue: {
    color: BRAND.primaryDark,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  downpaymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F4DFB3',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 13,
  },
  downpaymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFEBC5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downpaymentCopy: {
    flex: 1,
  },
  downpaymentLabel: {
    color: '#7A4C00',
    fontSize: 11.5,
    fontWeight: '800',
  },
  downpaymentHint: {
    color: '#99743C',
    fontSize: 9.5,
    marginTop: 1,
  },
  downpaymentValue: {
    color: '#7A4C00',
    fontSize: 15,
    fontWeight: '800',
  },
  paidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 17,
    marginBottom: 6,
  },
  sectionLabel: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '800',
  },
  optionalLabel: {
    color: BRAND.muted,
    fontSize: 10.5,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 9,
  },
  quickChip: {
    backgroundColor: '#F1F7F4',
    borderWidth: 1,
    borderColor: '#D7E4DF',
  },
  quickChipText: {
    fontSize: 10.5,
    color: BRAND.primaryDark,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  balanceCopy: {
    flex: 1,
  },
  balanceLabel: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '800',
  },
  balanceHint: {
    color: BRAND.muted,
    fontSize: 10,
    marginTop: 1,
  },
  balanceValue: {
    color: BRAND.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  helper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  helperText: {
    flex: 1,
    color: BRAND.muted,
    fontSize: 10,
    lineHeight: 15,
  },
});
