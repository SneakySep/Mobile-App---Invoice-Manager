import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { DEPOSIT_STATUS_META } from '../constants/theme';
import type { DepositStatus } from '../types/invoice';

interface DepositStatusBadgeProps {
  status: DepositStatus;
  compact?: boolean;
}

/** A booking-facing payment state, distinct from the invoice's payment status. */
export function DepositStatusBadge({ status, compact = false }: DepositStatusBadgeProps) {
  const meta = DEPOSIT_STATUS_META[status];

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: meta.background, borderColor: meta.border },
      ]}
      accessibilityLabel={`Booking deposit: ${meta.label.toLowerCase()}`}
    >
      <MaterialCommunityIcons
        name={meta.icon}
        size={compact ? 12 : 14}
        color={meta.foreground}
      />
      <Text style={[styles.label, compact && styles.labelCompact, { color: meta.foreground }]}> 
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 10,
  },
});
