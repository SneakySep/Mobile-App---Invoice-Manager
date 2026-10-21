import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text } from 'react-native-paper';

import { BRAND } from '../constants/theme';
import type { AppIconName } from '../types/icons';

interface EmptyStateProps {
  icon: AppIconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={36} color={BRAND.primary} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          icon="plus"
          onPress={onAction}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primaryLight,
    marginBottom: 18,
  },
  title: {
    fontWeight: '700',
    color: BRAND.text,
    textAlign: 'center',
  },
  message: {
    color: BRAND.muted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
    lineHeight: 21,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
  },
  buttonContent: {
    paddingHorizontal: 8,
    height: 48,
  },
});
