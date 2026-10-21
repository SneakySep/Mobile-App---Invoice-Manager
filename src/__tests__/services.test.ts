import { CATALOG_ITEMS } from '../constants/catalog';
import {
  addServiceToLines,
  buildServiceLine,
  clampQuantity,
  normalizeUnitPrice,
  updateServiceLine,
} from '../utils/services';

describe('clampQuantity', () => {
  it('supports half-hour overtime increments', () => {
    expect(clampQuantity(0, 0.5)).toBe(0.5);
    expect(clampQuantity(1.5, 0.5)).toBe(1.5);
    expect(clampQuantity(1.24, 0.5)).toBe(1);
  });

  it('never goes below one step or above the maximum', () => {
    expect(clampQuantity(-5, 1)).toBe(1);
    expect(clampQuantity(500, 1, 20)).toBe(20);
  });
});

describe('buildServiceLine', () => {
  it('copies catalog details and calculates the line total', () => {
    const sofa = CATALOG_ITEMS.find((item) => item.id === 'sofa-2-seater');
    expect(sofa).toBeDefined();

    const line = buildServiceLine(sofa!, sofa!.options[0], 2);

    expect(line.name).toBe('2-Seater Sofa');
    expect(line.quantity).toBe(2);
    expect(line.unitPrice).toBe(1300);
    expect(line.totalPrice).toBe(2600);
    expect(line.variantLabel).toBeUndefined();
  });

  it('keeps the tier label for tiered items', () => {
    const mattress = CATALOG_ITEMS.find((item) => item.id === 'mattress-queen');
    expect(mattress).toBeDefined();
    const deep = mattress!.options.find((option) => option.id === 'deep');

    const line = buildServiceLine(mattress!, deep!, 1);
    expect(line.variantLabel).toBe('Deep');
    expect(line.unitPrice).toBe(1750);
  });

  it('uses a negotiated per-invoice price without changing the catalog', () => {
    const sofa = CATALOG_ITEMS.find((item) => item.id === 'sofa-2-seater')!;
    const line = buildServiceLine(sofa, sofa.options[0], 2, 1150.5);

    expect(line.unitPrice).toBe(1150.5);
    expect(line.totalPrice).toBe(2301);
    expect(sofa.options[0].price).toBe(1300);
  });

  it('recalculates the line when a saved price is edited', () => {
    const sofa = CATALOG_ITEMS.find((item) => item.id === 'sofa-2-seater')!;
    const line = buildServiceLine(sofa, sofa.options[0], 1);
    const updated = updateServiceLine(line, sofa, sofa.options[0], 3, 999.99);

    expect(updated.id).toBe(line.id);
    expect(updated.unitPrice).toBe(999.99);
    expect(updated.totalPrice).toBe(2999.97);
  });
});

describe('normalizeUnitPrice', () => {
  it('rounds valid overrides and falls back for invalid input', () => {
    expect(normalizeUnitPrice(1099.999, 1300)).toBe(1100);
    expect(normalizeUnitPrice(undefined, 1300)).toBe(1300);
    expect(normalizeUnitPrice(Number.NaN, 1300)).toBe(1300);
    expect(normalizeUnitPrice(-100, 1300)).toBe(0);
  });
});

describe('addServiceToLines', () => {
  it('merges matching service, tier, and price', () => {
    const sofa = CATALOG_ITEMS.find((item) => item.id === 'sofa-2-seater')!;
    const first = buildServiceLine(sofa, sofa.options[0], 1, 1200);
    const merged = addServiceToLines([first], sofa, sofa.options[0], 2, 1200);

    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].unitPrice).toBe(1200);
    expect(merged[0].totalPrice).toBe(3600);
  });

  it('keeps different negotiated prices as separate lines', () => {
    const sofa = CATALOG_ITEMS.find((item) => item.id === 'sofa-2-seater')!;
    const first = buildServiceLine(sofa, sofa.options[0], 1, 1200);
    const lines = addServiceToLines([first], sofa, sofa.options[0], 1, 1100);

    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.unitPrice)).toEqual([1200, 1100]);
  });
});
