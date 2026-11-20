import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { PAYMENT_STATUS_META } from '../constants/theme';
import type { PaymentStatus } from '../types/invoice';

interface StatusBadgeProps {
  status: PaymentStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const meta = PAYMENT_STATUS_META[status];

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: meta.background, borderColor: meta.border },
      ]}
      accessibilityLabel={`Payment status: ${meta.label.toLowerCase()}`}
    >
      <MaterialCommunityIcons
        name={meta.icon}
        size={compact ? 12 : 14}
        color={meta.foreground}
      />
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: meta.foreground },
        ]}
      >
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
    letterSpacing: 0.1,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 0,
  },
});
