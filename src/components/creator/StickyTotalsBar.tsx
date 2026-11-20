import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

import { BRAND } from '../../constants/theme';
import { DOWNPAYMENT_PERCENT_LABEL } from '../../constants/pricing';
import { formatPeso } from '../../utils/money';

interface StickyTotalsBarProps {
  grandTotal: number;
  downpaymentRequired: number;
  saving: boolean;
  busyLabel?: string;
  onSave: () => void;
}

/** Always-visible mobile summary and primary action. */
export function StickyTotalsBar({
  grandTotal,
  downpaymentRequired,
  saving,
  busyLabel,
  onSave,
}: StickyTotalsBarProps) {
  return (
    <Surface style={styles.surface} elevation={4}>
      <View style={styles.inner}>
        <View style={styles.totalsRow}>
          <View style={styles.totalBlock}>
            <Text style={styles.caption}>Grand total</Text>
            <Text style={styles.total}>{formatPeso(grandTotal)}</Text>
          </View>
          <View style={styles.downpaymentBlock}>
            <Text style={styles.caption}>{DOWNPAYMENT_PERCENT_LABEL} deposit</Text>
            <Text style={styles.downpayment}>{formatPeso(downpaymentRequired)}</Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          icon={saving ? undefined : 'check-circle-outline'}
          style={styles.saveButton}
          contentStyle={styles.saveContent}
          accessibilityLabel="Save invoice"
        >
          {saving ? (busyLabel ?? 'Saving invoice…') : 'Save & publish invoice'}
        </Button>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: BRAND.surface,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  inner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 9,
    gap: 12,
  },
  totalBlock: {
    flex: 1,
  },
  downpaymentBlock: {
    alignItems: 'flex-end',
  },
  caption: {
    color: BRAND.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  total: {
    color: BRAND.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  downpayment: {
    color: BRAND.primaryDark,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveContent: {
    height: 49,
  },
});
