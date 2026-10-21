import { MAX_LINE_QUANTITY, MAX_MONEY_INPUT } from '../constants/pricing';
import type { CatalogItem, PriceOption } from '../types/catalog';
import type { InvoiceService } from '../types/invoice';
import { calculateLineTotal } from './calculations';
import { createLineId } from './ids';
import { roundMoney, toCents } from './money';

/**
 * Rounds a quantity to a valid step (important for the 0.5-hour overtime item).
 * There is always at least one step, so pressing minus can never create a 0 line.
 */
export function clampQuantity(
  quantity: number,
  step: number,
  maxQuantity = MAX_LINE_QUANTITY,
): number {
  const safeStep = step > 0 ? step : 1;
  const safeMax = maxQuantity > 0 ? maxQuantity : MAX_LINE_QUANTITY;
  const stepped = Math.round(quantity / safeStep) * safeStep;
  return Number(Math.min(safeMax, Math.max(safeStep, stepped)).toFixed(2));
}

/**
 * A per-invoice price override is allowed, but it still has to be a sane peso
 * amount. Non-numeric input falls back to the catalog price and out-of-range
 * values are clamped rather than corrupting a saved receipt.
 */
export function normalizeUnitPrice(unitPrice: number | undefined, fallbackPrice: number): number {
  const fallback = Number.isFinite(fallbackPrice) ? fallbackPrice : 0;
  const value = unitPrice !== undefined && Number.isFinite(unitPrice) ? unitPrice : fallback;
  return roundMoney(Math.min(MAX_MONEY_INPUT, Math.max(0, value)));
}

export function buildServiceLine(
  item: CatalogItem,
  option: PriceOption,
  quantity: number,
  unitPrice?: number,
): InvoiceService {
  const safeQuantity = clampQuantity(quantity, item.quantityStep, item.maxQuantity);
  const safeUnitPrice = normalizeUnitPrice(unitPrice, option.price);

  return {
    id: createLineId(),
    catalogId: item.id,
    optionId: option.id,
    category: item.category,
    name: item.name,
    variantLabel: option.label,
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    totalPrice: calculateLineTotal(safeUnitPrice, safeQuantity),
  };
}

export function updateServiceLine(
  line: InvoiceService,
  item: CatalogItem,
  option: PriceOption,
  quantity: number,
  unitPrice?: number,
): InvoiceService {
  const safeQuantity = clampQuantity(quantity, item.quantityStep, item.maxQuantity);
  const safeUnitPrice = normalizeUnitPrice(unitPrice, option.price);

  return {
    ...line,
    catalogId: item.id,
    optionId: option.id,
    category: item.category,
    name: item.name,
    variantLabel: option.label,
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    totalPrice: calculateLineTotal(safeUnitPrice, safeQuantity),
  };
}

/**
 * Adds a line, or increases the quantity of the matching line when the
 * service, tier, and negotiated unit price are all the same. Different prices
 * remain separate lines so an invoice can quote two rates for one service.
 */
export function addServiceToLines(
  lines: InvoiceService[],
  item: CatalogItem,
  option: PriceOption,
  quantity: number,
  unitPrice?: number,
): InvoiceService[] {
  const safeUnitPrice = normalizeUnitPrice(unitPrice, option.price);
  const existing = lines.find(
    (line) =>
      line.catalogId === item.id &&
      line.optionId === option.id &&
      toCents(line.unitPrice) === toCents(safeUnitPrice),
  );

  if (existing) {
    const mergedQuantity = clampQuantity(
      existing.quantity + quantity,
      item.quantityStep,
      item.maxQuantity,
    );
    return lines.map((line) =>
      line.id === existing.id
        ? updateServiceLine(line, item, option, mergedQuantity, safeUnitPrice)
        : line,
    );
  }

  return [...lines, buildServiceLine(item, option, quantity, safeUnitPrice)];
}
