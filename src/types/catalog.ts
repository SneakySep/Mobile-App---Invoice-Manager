/** The four service groups shown in the invoice creator. */
export type ServiceCategoryKey = 'sessions' | 'furniture' | 'mattresses' | 'addons';

/** A selectable price for a catalog item. Fixed-price items have one option. */
export interface PriceOption {
  id: string;
  /** Displayed for tiered items, e.g. "Standard", "Deep", "Premium". */
  label?: string;
  price: number;
}

export interface CatalogItem {
  id: string;
  category: ServiceCategoryKey;
  name: string;
  description?: string;
  /** Used as the suffix in the PDF, e.g. "cleaner", "sofa", "hour". */
  unitLabel: string;
  icon: import('./icons').AppIconName;
  /** How much each tap of +/- changes the quantity. */
  quantityStep: number;
  maxQuantity?: number;
  options: PriceOption[];
}

export interface CatalogSection {
  key: ServiceCategoryKey;
  title: string;
  description: string;
  icon: import('./icons').AppIconName;
  items: CatalogItem[];
}
