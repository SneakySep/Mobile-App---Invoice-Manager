import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableRipple } from 'react-native-paper';

import type { CatalogItem, CatalogSection } from '../../types/catalog';
import { BRAND } from '../../constants/theme';
import { formatPeso } from '../../utils/money';

interface CatalogAccordionProps {
  section: CatalogSection;
  expanded: boolean;
  selectedCount: number;
  onToggle: () => void;
  onSelectItem: (item: CatalogItem) => void;
}

function getPriceSummary(item: CatalogItem): { price: string; unit: string } {
  const prices = item.options.map((option) => option.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const price =
    min === max ? formatPeso(min) : `${formatPeso(min)} – ${formatPeso(max)}`;
  return { price, unit: `/ ${item.unitLabel}` };
}

export function CatalogAccordion({
  section,
  expanded,
  selectedCount,
  onToggle,
  onSelectItem,
}: CatalogAccordionProps) {
  return (
    <View style={styles.card}>
      <TouchableRipple
        onPress={onToggle}
        rippleColor="rgba(11, 107, 99, 0.08)"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${section.title} section, ${selectedCount} selected`}
      >
        <View style={[styles.header, expanded && styles.headerExpanded]}>
          <View style={styles.sectionIcon}>
            <MaterialCommunityIcons name={section.icon} size={20} color={BRAND.primary} />
          </View>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.title}>
                {section.title}
              </Text>
              {selectedCount > 0 ? (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{selectedCount} selected</Text>
                </View>
              ) : null}
            </View>
            <Text variant="bodySmall" style={styles.description}>
              {section.description}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={BRAND.muted}
          />
        </View>
      </TouchableRipple>

      {expanded ? (
        <View style={styles.body}>
          {section.items.map((item, index) => {
            const { price, unit } = getPriceSummary(item);
            return (
              <View key={item.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <TouchableRipple
                  onPress={() => onSelectItem(item)}
                  rippleColor="rgba(11, 107, 99, 0.08)"
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}`}
                  accessibilityHint={
                    item.options.length > 1
                      ? 'Opens the price and quantity options.'
                      : 'Opens the quantity options.'
                  }
                >
                  <View style={styles.itemRow}>
                    <View style={styles.itemIcon}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={BRAND.primary}
                      />
                    </View>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.description ? (
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      ) : null}
                      <View style={styles.priceRow}>
                        <Text style={styles.price}>{price}</Text>
                        <Text style={styles.unit}>{unit}</Text>
                        {item.options.length > 1 ? (
                          <Text style={styles.choose}>· choose a level</Text>
                        ) : null}
                      </View>
                    </View>
                    <MaterialCommunityIcons
                      name="plus-circle"
                      size={27}
                      color={BRAND.primary}
                    />
                  </View>
                </TouchableRipple>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
  },
  headerExpanded: {
    paddingBottom: 13,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primaryLight,
  },
  headerCopy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  title: {
    fontWeight: '700',
    color: BRAND.text,
    letterSpacing: -0.2,
    fontSize: 15,
  },
  countPill: {
    backgroundColor: BRAND.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    color: BRAND.primaryDark,
    fontSize: 10.5,
    fontWeight: '800',
  },
  description: {
    color: BRAND.muted,
    marginTop: 2,
    fontSize: 11,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#EDF2F0',
    paddingHorizontal: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F8F6',
  },
  itemCopy: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    color: BRAND.text,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  itemDescription: {
    color: BRAND.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  price: {
    color: BRAND.primaryDark,
    fontSize: 12.5,
    fontWeight: '800',
  },
  unit: {
    color: BRAND.muted,
    fontSize: 11,
    marginLeft: 3,
  },
  choose: {
    color: BRAND.muted,
    fontSize: 11,
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F0',
    marginLeft: 45,
  },
});
