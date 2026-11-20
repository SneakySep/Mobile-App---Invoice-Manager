import { useLayoutEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TouchableRipple,
} from 'react-native-paper';

import { BRAND } from '../../constants/theme';
import type { CatalogItem, PriceOption } from '../../types/catalog';
import type { InvoiceService } from '../../types/invoice';
import { calculateLineTotal } from '../../utils/calculations';
import {
  formatAmountForInput,
  formatPeso,
  formatQuantity,
  parseMoneyInput,
  toCents,
} from '../../utils/money';
import { clampQuantity } from '../../utils/services';
import { getUnitPriceError } from '../../utils/validation';
import { AmountInput } from '../AmountInput';

interface LineItemEditorModalProps {
  visible: boolean;
  item: CatalogItem | null;
  editingLine: InvoiceService | null;
  onDismiss: () => void;
  onSubmit: (
    item: CatalogItem,
    option: PriceOption,
    quantity: number,
    unitPrice: number,
  ) => void;
}

const LEVEL_SCOPE: Record<string, string> = {
  standard: 'Routine care for regular upkeep.',
  deep: 'Extra attention for built-up dirt and stains.',
  premium: 'Deep care for the most demanding cleaning needs.',
};

/**
 * Bottom sheet used both to add a service and to edit an existing line.
 * Keeping the price-tier chooser here keeps the catalog itself uncluttered.
 */
export function LineItemEditorModal({
  visible,
  item,
  editingLine,
  onDismiss,
  onSubmit,
}: LineItemEditorModalProps) {
  const insets = useSafeAreaInsets();
  const [optionId, setOptionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [priceText, setPriceText] = useState('');
  const [priceOverrideEnabled, setPriceOverrideEnabled] = useState(false);

  useLayoutEffect(() => {
    if (!visible || !item) return;

    const initialOption =
      (editingLine?.optionId
        ? item.options.find((option) => option.id === editingLine.optionId)
        : undefined) ?? item.options[0];
    const initialQuantity = editingLine?.quantity ?? Math.max(1, item.quantityStep);
    const initialPrice = editingLine?.unitPrice ?? initialOption?.price ?? 0;

    setOptionId(initialOption?.id ?? '');
    setQuantity(clampQuantity(initialQuantity, item.quantityStep, item.maxQuantity));
    setPriceText(formatAmountForInput(initialPrice));
    setPriceOverrideEnabled(
      toCents(initialPrice) !== toCents(initialOption?.price ?? initialPrice),
    );
  }, [visible, item, editingLine]);

  if (!item) {
    return null;
  }

  const selectedOption =
    item.options.find((option) => option.id === optionId) ?? item.options[0];
  const step = item.quantityStep;
  const maxQuantity = item.maxQuantity;
  const minimum = step;

  if (!selectedOption) {
    return null;
  }

  const unitPrice = parseMoneyInput(priceText);
  const priceError = !/\d/.test(priceText)
    ? 'Enter a unit price.'
    : getUnitPriceError(unitPrice);
  const lineTotal = calculateLineTotal(unitPrice, quantity);
  const isEditing = Boolean(editingLine);
  const isCustomPrice = toCents(unitPrice) !== toCents(selectedOption.price);

  const updateQuantity = (next: number) => {
    setQuantity(clampQuantity(next, step, maxQuantity));
  };

  const selectOption = (nextOption: PriceOption) => {
    const wasUsingCatalogPrice =
      toCents(parseMoneyInput(priceText)) === toCents(selectedOption.price);
    setOptionId(nextOption.id);

    // Follow the new tier's catalog price unless the user has negotiated a
    // custom price, in which case their override should survive the tier change.
    if (wasUsingCatalogPrice) {
      setPriceText(formatAmountForInput(nextOption.price));
    }
  };

  const useCatalogPrice = () => {
    setPriceText(formatAmountForInput(selectedOption.price));
    setPriceOverrideEnabled(false);
  };

  const dismiss = () => {
    Keyboard.dismiss();
    onDismiss();
  };

  const submit = () => {
    if (priceError) return;
    Keyboard.dismiss();
    onSubmit(item, selectedOption, quantity, unitPrice);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={dismiss}
        style={styles.modalWrapper}
        contentContainerStyle={styles.sheet}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{isEditing ? 'EDIT SERVICE' : 'ADD SERVICE'}</Text>
            <Text variant="headlineSmall" style={styles.title}>
              {item.name}
            </Text>
            {item.description ? (
              <Text variant="bodySmall" style={styles.description}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <IconButton
            icon="close"
            size={22}
            onPress={dismiss}
            accessibilityLabel="Close service editor"
            style={styles.closeButton}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {item.options.length > 1 ? (
            <>
              <Text style={styles.fieldLabel}>Choose a cleaning level</Text>
              <View style={styles.optionList}>
                {item.options.map((option) => {
                  const selected = option.id === selectedOption.id;
                  const scope = LEVEL_SCOPE[option.id];
                  return (
                    <TouchableRipple
                      key={option.id}
                      onPress={() => selectOption(option)}
                      rippleColor="rgba(11, 107, 99, 0.08)"
                      style={[
                        styles.optionCard,
                        selected && styles.optionCardSelected,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${option.label ?? 'Option'}, ${formatPeso(option.price)}`}
                    >
                      <View style={styles.optionCardContent}>
                        <View style={[styles.radio, selected && styles.radioSelected]}>
                          {selected ? (
                            <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                          ) : null}
                        </View>
                        <View style={styles.optionCopy}>
                          <Text
                            style={[
                              styles.optionLabel,
                              selected && styles.optionLabelSelected,
                            ]}
                          >
                            {option.label ?? 'Standard'}
                          </Text>
                          {scope ? <Text style={styles.optionScope}>{scope}</Text> : null}
                        </View>
                        <Text
                          style={[
                            styles.optionPrice,
                            selected && styles.optionPriceSelected,
                          ]}
                        >
                          {formatPeso(option.price)}
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.singlePrice}>
              <Text style={styles.singlePriceLabel}>Catalog price per {item.unitLabel}</Text>
              <Text style={styles.singlePriceValue}>{formatPeso(selectedOption.price)}</Text>
            </View>
          )}

          <View style={styles.priceCard}>
            {priceOverrideEnabled ? (
              <AmountInput
                label={`Unit price per ${item.unitLabel}`}
                value={priceText}
                onChangeText={setPriceText}
                onSubmitEditing={() => Keyboard.dismiss()}
                errorText={priceError}
                helperText={
                  isCustomPrice
                    ? `Custom price for this invoice. Catalog: ${formatPeso(
                        selectedOption.price,
                      )}.`
                    : 'This invoice is using the catalog price.'
                }
                accessibilityLabel={`Unit price for ${item.name}`}
              />
            ) : (
              <View style={styles.catalogPriceSummary}>
                <View>
                  <Text style={styles.catalogPriceLabel}>Catalog price per {item.unitLabel}</Text>
                  <Text style={styles.catalogPriceHint}>Use this unless you have agreed a special rate.</Text>
                </View>
                <Text style={styles.catalogPriceValue}>{formatPeso(selectedOption.price)}</Text>
              </View>
            )}
            {priceOverrideEnabled ? (
              <Button
                mode="text"
                compact
                icon="restore"
                onPress={useCatalogPrice}
                textColor={BRAND.primary}
                style={styles.catalogPriceButton}
              >
                Use catalog price
              </Button>
            ) : (
              <Button
                mode="outlined"
                compact
                icon="pencil-outline"
                onPress={() => setPriceOverrideEnabled(true)}
                style={styles.adjustPriceButton}
              >
                Adjust price
              </Button>
            )}
          </View>

          <View style={styles.quantityCard}>
            <View>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.quantityCaption}>
                {formatPeso(unitPrice)} per {item.unitLabel}
              </Text>
            </View>
            <View style={styles.stepper}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={18}
                disabled={quantity <= minimum}
                onPress={() => updateQuantity(quantity - step)}
                accessibilityLabel="Decrease quantity"
                style={styles.stepButton}
              />
              <Text style={styles.quantityValue} accessibilityLabel={`Quantity ${formatQuantity(quantity)}`}>
                {formatQuantity(quantity)}
              </Text>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={18}
                disabled={Boolean(maxQuantity) && quantity >= (maxQuantity ?? Infinity)}
                onPress={() => updateQuantity(quantity + step)}
                accessibilityLabel="Increase quantity"
                style={styles.stepButton}
              />
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Line total</Text>
            <Text style={styles.totalValue}>{formatPeso(lineTotal)}</Text>
          </View>

          <Button
            mode="contained"
            icon={isEditing ? 'content-save-check-outline' : 'plus'}
            onPress={submit}
            disabled={Boolean(priceError)}
            style={styles.submitButton}
            contentStyle={styles.submitContent}
          >
            {isEditing ? 'Save changes' : 'Add to invoice'}
          </Button>
          <Button
            mode="text"
            onPress={dismiss}
            textColor={BRAND.muted}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'flex-end',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    backgroundColor: BRAND.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    maxHeight: '92%',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDDAD6',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    gap: 10,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: BRAND.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: BRAND.text,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  description: {
    color: BRAND.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  closeButton: {
    margin: 0,
    marginTop: -4,
    marginRight: -8,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    color: BRAND.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  optionList: {
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: '#FBFDFC',
  },
  optionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionCardSelected: {
    borderColor: BRAND.primary,
    backgroundColor: BRAND.mint,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#A9B9B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: BRAND.primary,
    backgroundColor: BRAND.primary,
  },
  optionLabel: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: '600',
  },
  optionCopy: {
    flex: 1,
  },
  optionScope: {
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  optionLabelSelected: {
    color: BRAND.primaryDark,
    fontWeight: '700',
  },
  optionPrice: {
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  optionPriceSelected: {
    color: BRAND.primaryDark,
  },
  singlePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  singlePriceLabel: {
    color: BRAND.muted,
    fontSize: 12,
  },
  singlePriceValue: {
    color: BRAND.primaryDark,
    fontSize: 16,
    fontWeight: '800',
  },
  priceCard: {
    marginBottom: 14,
  },
  catalogPriceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 13,
    backgroundColor: '#F7FAF8',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  catalogPriceLabel: {
    color: BRAND.text,
    fontSize: 12,
    fontWeight: '700',
  },
  catalogPriceHint: {
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  catalogPriceValue: {
    color: BRAND.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  catalogPriceButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: -8,
  },
  adjustPriceButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 10,
  },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  quantityCaption: {
    color: BRAND.muted,
    fontSize: 11,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stepButton: {
    margin: 0,
    backgroundColor: BRAND.primaryLight,
  },
  quantityValue: {
    minWidth: 48,
    textAlign: 'center',
    color: BRAND.text,
    fontSize: 19,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingTop: 15,
    marginBottom: 16,
  },
  totalLabel: {
    color: BRAND.muted,
    fontSize: 13,
  },
  totalValue: {
    color: BRAND.primaryDark,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  submitButton: {
    borderRadius: 13,
  },
  submitContent: {
    height: 50,
  },
  cancelButton: {
    marginTop: 2,
  },
});
