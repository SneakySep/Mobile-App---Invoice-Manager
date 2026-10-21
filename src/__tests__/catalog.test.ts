import { CATALOG_ITEMS, CATALOG_SECTIONS } from '../constants/catalog';
import { createInvoiceId } from '../utils/ids';

function item(id: string) {
  const found = CATALOG_ITEMS.find((entry) => entry.id === id);
  expect(found).toBeDefined();
  return found!;
}

function prices(id: string): number[] {
  return item(id).options.map((option) => option.price);
}

describe('service catalog', () => {
  it('publishes every price from the Soxy rate card', () => {
    expect(prices('session-5-hour')).toEqual([1099]);
    expect(prices('session-6-hour')).toEqual([1299]);
    expect(prices('overtime')).toEqual([200]);
    expect(item('overtime').quantityStep).toBe(0.5);

    expect(prices('grease-trap')).toEqual([400]);
    expect(prices('refrigerator')).toEqual([399, 499]);

    expect(prices('sofa-2-seater')).toEqual([1300]);
    expect(prices('sofa-3-seater')).toEqual([1500]);
    expect(prices('sofa-4-seater')).toEqual([2000]);
    expect(prices('sofa-4-seater-pullout')).toEqual([2500]);

    expect(prices('mattress-single-twin')).toEqual([900, 1050, 1200]);
    expect(prices('mattress-queen')).toEqual([1500, 1750, 2000]);
    expect(prices('mattress-king')).toEqual([1800, 2150, 2500]);

    expect(prices('dining-chair')).toEqual([250, 325, 400]);
    expect(prices('office-chair')).toEqual([250, 375, 500]);
    expect(prices('pillow')).toEqual([85, 120, 150]);
  });

  it('labels multi-tier options in ascending price order', () => {
    const tiered = CATALOG_ITEMS.filter((entry) => entry.options.length > 1);

    expect(tiered.length).toBeGreaterThan(0);
    tiered.forEach((entry) => {
      const expectedLabels =
        entry.options.length === 2
          ? ['Standard', 'Deep']
          : ['Standard', 'Deep', 'Premium'];
      expect(entry.options.map((option) => option.label)).toEqual(expectedLabels);
      expect(prices(entry.id)).toEqual([...prices(entry.id)].sort((a, b) => a - b));
    });
  });

  it('has unique service and section identifiers', () => {
    const ids = CATALOG_ITEMS.map((entry) => entry.id);
    const sectionKeys = CATALOG_SECTIONS.map((section) => section.key);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
  });
});

describe('invoice identifiers', () => {
  it('matches the INV-SOXY-<timestamp> convention', () => {
    expect(createInvoiceId(1_760_000_000_000)).toBe('INV-SOXY-1760000000000');
  });
});
