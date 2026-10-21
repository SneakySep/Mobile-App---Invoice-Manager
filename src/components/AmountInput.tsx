import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import type { StyleProp, TextStyle } from 'react-native';

import { BRAND } from '../constants/theme';
import { sanitizeMoneyInput } from '../utils/money';

interface AmountInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  errorText?: string | null;
  helperText?: string;
  disabled?: boolean;
  compact?: boolean;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
}

/** Currency text field that accepts only digits and up to two decimal places. */
export function AmountInput({
  label,
  value,
  onChangeText,
  placeholder = '0.00',
  errorText,
  helperText,
  disabled = false,
  compact = false,
  onBlur,
  onSubmitEditing,
  accessibilityLabel,
  style,
}: AmountInputProps) {
  const helper = errorText ?? helperText;

  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={(text) => onChangeText(sanitizeMoneyInput(text))}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoCorrect={false}
        disabled={disabled}
        dense={compact}
        error={Boolean(errorText)}
        left={<TextInput.Affix text="₱" />}
        right={
          compact ? undefined : (
            <TextInput.Icon
              icon="cash-multiple"
              color="#7D8F89"
              forceTextInputFocus={false}
            />
          )
        }
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="done"
        maxLength={12}
        accessibilityLabel={accessibilityLabel ?? label ?? 'Amount in pesos'}
        style={style}
        contentStyle={compact ? styles.compactContent : undefined}
      />
      {helper ? (
        <Text style={[styles.helper, errorText ? styles.error : undefined]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContent: {
    fontSize: 15,
    paddingVertical: 4,
    minHeight: 34,
  },
  helper: {
    color: BRAND.muted,
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  error: {
    color: BRAND.danger,
  },
});
