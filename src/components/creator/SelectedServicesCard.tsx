import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';

import { findCatalogItem } from '../../constants/catalog';
import { BRAND } from '../../constants/theme';
import { SectionCard } from '../SectionCard';
import type { InvoiceService } from '../../types/invoice';
import { formatPeso, formatQuantity, toCents } from '../../utils/money';

interface SelectedServicesCardProps {
  services: InvoiceService[];
  subtotal: number;
  onEdit: (line: InvoiceService) => void;
  onRemove: (lineId: string) => void;
}

export function SelectedServicesCard({
  services,
  subtotal,
  onEdit,
  onRemove,
}: SelectedServicesCardProps) {
  return (
    <SectionCard
      title="Selected services"
      subtitle={
        services.length === 0
          ? 'Your invoice is empty'
          : `${services.length} line${services.length === 1 ? '' : 's'} · tap to edit price or quantity`
      }
      icon="clipboard-list-outline"
      right={
        services.length > 0 ? (
          <View style={styles.subtotal}>
            <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
            <Text style={styles.subtotalValue}>{formatPeso(subtotal)}</Text>
          </View>
        ) : undefined
      }
    >
      {services.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="basket-outline" size={30} color="#90A29C" />
          <Text style={styles.emptyTitle}>No services added yet</Text>
          <Text style={styles.emptyText}>
            Pick from the service menu below to start building this invoice.
          </Text>
        </View>
      ) : (
        <View>
          {services.map((line, index) => {
            const catalogItem = findCatalogItem(line.catalogId);
            const catalogPrice = catalogItem?.options.find(
              (option) => option.id === line.optionId,
            )?.price;
            const isCustomPrice =
              catalogPrice !== undefined && toCents(line.unitPrice) !== toCents(catalogPrice);
            return (
              <View key={line.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <TouchableRipple
                    onPress={() => onEdit(line)}
                    rippleColor="rgba(11, 107, 99, 0.07)"
                    style={styles.rowMain}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${line.name}`}
                    accessibilityHint="Opens the service quantity, tier, and price options."
                  >
                    <View style={styles.rowContent}>
                      <View style={styles.icon}>
                        <MaterialCommunityIcons
                          name={catalogItem?.icon ?? 'broom'}
                          size={18}
                          color={BRAND.primary}
                        />
                      </View>
                      <View style={styles.copy}>
                        <Text style={styles.name}>
                          {line.name}
                          {line.variantLabel ? (
                            <Text style={styles.variant}> · {line.variantLabel}</Text>
                          ) : null}
                        </Text>
                        <Text style={styles.meta}>
                          {formatQuantity(line.quantity)} × {formatPeso(line.unitPrice)}
                          {catalogItem ? ` / ${catalogItem.unitLabel}` : ''}
                          {isCustomPrice ? (
                            <Text style={styles.customPrice}> · custom price</Text>
                          ) : null}
                        </Text>
                      </View>
                      <Text style={styles.lineTotal}>{formatPeso(line.totalPrice)}</Text>
                    </View>
                  </TouchableRipple>
                  <IconButton
                    icon="delete-outline"
                    iconColor={BRAND.danger}
                    size={19}
                    onPress={() => onRemove(line.id)}
                    accessibilityLabel={`Remove ${line.name}`}
                    style={styles.removeButton}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  subtotal: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    color: BRAND.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtotalValue: {
    color: BRAND.primaryDark,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5E2DE',
    borderRadius: 13,
    backgroundColor: '#FBFDFC',
  },
  emptyTitle: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 7,
  },
  emptyText: {
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F0',
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    borderRadius: 10,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingRight: 4,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F2F8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  name: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  variant: {
    color: BRAND.muted,
    fontWeight: '500',
  },
  meta: {
    color: BRAND.muted,
    fontSize: 11,
    marginTop: 1,
  },
  customPrice: {
    color: BRAND.accent,
    fontWeight: '700',
  },
  lineTotal: {
    color: BRAND.text,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
  },
  removeButton: {
    margin: 0,
    marginLeft: 1,
    marginRight: -6,
  },
});
