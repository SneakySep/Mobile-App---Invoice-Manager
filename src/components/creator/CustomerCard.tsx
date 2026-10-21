import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

import { MAX_CUSTOMER_NAME_LENGTH } from '../../constants/pricing';
import { BRAND } from '../../constants/theme';
import { SectionCard } from '../SectionCard';

interface CustomerCardProps {
  value: string;
  onChangeText: (value: string) => void;
  errorText?: string;
}

export function CustomerCard({ value, onChangeText, errorText }: CustomerCardProps) {
  return (
    <SectionCard
      title="Customer"
      subtitle="Who are we cleaning for?"
      icon="account-outline"
    >
      <TextInput
        mode="outlined"
        label="Customer name"
        placeholder="e.g. Maria Santos"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={MAX_CUSTOMER_NAME_LENGTH}
        left={<TextInput.Icon icon="account" color={BRAND.primary} />}
        error={Boolean(errorText)}
        returnKeyType="done"
        accessibilityLabel="Customer name"
      />
      {errorText ? (
        <Text style={styles.error}>{errorText}</Text>
      ) : (
        <View style={styles.footerRow}>
          <Text style={styles.helper}>The invoice number and date are created on save.</Text>
          <Text style={styles.counter}>
            {value.length}/{MAX_CUSTOMER_NAME_LENGTH}
          </Text>
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  error: {
    color: BRAND.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    marginHorizontal: 4,
    gap: 12,
  },
  helper: {
    color: BRAND.muted,
    fontSize: 11,
    flex: 1,
  },
  counter: {
    color: '#8A9A95',
    fontSize: 11,
  },
});
