import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { BRAND } from '../constants/theme';
import type { AppIconName } from '../types/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: AppIconName;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/** The common white card used throughout the invoice form. */
export function SectionCard({
  title,
  subtitle,
  icon,
  right,
  children,
  style,
  contentStyle,
}: SectionCardProps) {
  return (
    <Surface style={[styles.card, style]} elevation={0}>
      {title ? (
        <View style={styles.header}>
          {icon ? (
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={icon} size={18} color={BRAND.primary} />
            </View>
          ) : null}
          <View style={styles.headerCopy}>
            <Text variant="titleMedium" style={styles.title}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primaryLight,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: BRAND.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: BRAND.muted,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
});
