import type { CatalogItem, CatalogSection, PriceOption } from '../types/catalog';

/**
 * Soxy's service menu.
 *
 * All pricing lives here so it can be updated without touching the screens.
 * Items with more than one price option open a chooser in the app.
 */
export const CATALOG_SECTIONS: CatalogSection[] = [
  {
    key: 'sessions',
    title: 'Cleaning Sessions',
    description: 'Book cleaners by the hour or by the crew.',
    icon: 'clock-outline',
    items: [
      {
        id: 'session-5-hour',
        category: 'sessions',
        name: '5-Hour Cleaning Session',
        description: 'Includes one cleaner. Increase the quantity for more cleaners.',
        unitLabel: 'cleaner',
        icon: 'clock-time-five-outline',
        quantityStep: 1,
        maxQuantity: 20,
        options: [{ id: 'standard', price: 1099 }],
      },
      {
        id: 'session-6-hour',
        category: 'sessions',
        name: '6-Hour Cleaning Session',
        description: 'Priced per person. Increase the quantity for every cleaner.',
        unitLabel: 'person',
        icon: 'clock-time-six-outline',
        quantityStep: 1,
        maxQuantity: 20,
        options: [{ id: 'standard', price: 1299 }],
      },
      {
        id: 'overtime',
        category: 'sessions',
        name: 'Overtime',
        description: 'Extended cleaning time. Billed in 30-minute increments.',
        unitLabel: 'hour',
        icon: 'timer-outline',
        quantityStep: 0.5,
        maxQuantity: 24,
        options: [{ id: 'standard', price: 200 }],
      },
    ],
  },
  {
    key: 'furniture',
    title: 'Furniture, Chairs & Pillows',
    description: 'Upholstery and fabric refreshes, priced per piece.',
    icon: 'sofa-outline',
    items: [
      {
        id: 'sofa-2-seater',
        category: 'furniture',
        name: '2-Seater Sofa',
        unitLabel: 'sofa',
        icon: 'sofa-outline',
        quantityStep: 1,
        options: [{ id: 'standard', price: 1300 }],
      },
      {
        id: 'sofa-3-seater',
        category: 'furniture',
        name: '3-Seater Sofa',
        unitLabel: 'sofa',
        icon: 'sofa-outline',
        quantityStep: 1,
        options: [{ id: 'standard', price: 1500 }],
      },
      {
        id: 'sofa-4-seater',
        category: 'furniture',
        name: '4-Seater Sofa',
        unitLabel: 'sofa',
        icon: 'sofa-outline',
        quantityStep: 1,
        options: [{ id: 'standard', price: 2000 }],
      },
      {
        id: 'sofa-4-seater-pullout',
        category: 'furniture',
        name: '4-Seater Sofa with Pull-Out',
        unitLabel: 'sofa',
        icon: 'sofa-outline',
        quantityStep: 1,
        options: [{ id: 'standard', price: 2500 }],
      },
      {
        id: 'dining-chair',
        category: 'furniture',
        name: 'Dining Chair',
        description: 'Choose the cleaning level.',
        unitLabel: 'chair',
        icon: 'seat-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 250 },
          { id: 'deep', label: 'Deep', price: 325 },
          { id: 'premium', label: 'Premium', price: 400 },
        ],
      },
      {
        id: 'office-chair',
        category: 'furniture',
        name: 'Office / Executive Chair',
        description: 'Choose the cleaning level.',
        unitLabel: 'chair',
        icon: 'seat-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 250 },
          { id: 'deep', label: 'Deep', price: 375 },
          { id: 'premium', label: 'Premium', price: 500 },
        ],
      },
      {
        id: 'pillow',
        category: 'furniture',
        name: 'Pillow Cleaning',
        description: 'Choose the cleaning level.',
        unitLabel: 'pillow',
        icon: 'bed-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 85 },
          { id: 'deep', label: 'Deep', price: 120 },
          { id: 'premium', label: 'Premium', price: 150 },
        ],
      },
    ],
  },
  {
    key: 'mattresses',
    title: 'Mattresses',
    description: 'Deep extraction for a fresher night’s sleep.',
    icon: 'bed-outline',
    items: [
      {
        id: 'mattress-single-twin',
        category: 'mattresses',
        name: 'Single / Twin Mattress',
        description: 'Choose the cleaning level.',
        unitLabel: 'mattress',
        icon: 'bed-single-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 900 },
          { id: 'deep', label: 'Deep', price: 1050 },
          { id: 'premium', label: 'Premium', price: 1200 },
        ],
      },
      {
        id: 'mattress-queen',
        category: 'mattresses',
        name: 'Queen Mattress',
        description: 'Choose the cleaning level.',
        unitLabel: 'mattress',
        icon: 'bed-queen-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 1500 },
          { id: 'deep', label: 'Deep', price: 1750 },
          { id: 'premium', label: 'Premium', price: 2000 },
        ],
      },
      {
        id: 'mattress-king',
        category: 'mattresses',
        name: 'King Mattress',
        description: 'Choose the cleaning level.',
        unitLabel: 'mattress',
        icon: 'bed-king-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 1800 },
          { id: 'deep', label: 'Deep', price: 2150 },
          { id: 'premium', label: 'Premium', price: 2500 },
        ],
      },
    ],
  },
  {
    key: 'addons',
    title: 'Add-Ons',
    description: 'Extra care for the places grease and odors hide.',
    icon: 'plus-circle-outline',
    items: [
      {
        id: 'grease-trap',
        category: 'addons',
        name: 'Grease Trap Cleaning',
        unitLabel: 'service',
        icon: 'water-outline',
        quantityStep: 1,
        options: [{ id: 'standard', price: 400 }],
      },
      {
        id: 'refrigerator',
        category: 'addons',
        name: 'Refrigerator Cleaning',
        description: 'Choose a standard or deep clean.',
        unitLabel: 'unit',
        icon: 'fridge-outline',
        quantityStep: 1,
        options: [
          { id: 'standard', label: 'Standard', price: 399 },
          { id: 'deep', label: 'Deep', price: 499 },
        ],
      },
    ],
  },
];

export const CATALOG_ITEMS: CatalogItem[] = CATALOG_SECTIONS.flatMap((section) => section.items);

export function findCatalogItem(itemId: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find((item) => item.id === itemId);
}

export function findPriceOption(item: CatalogItem, optionId: string): PriceOption | undefined {
  return item.options.find((option) => option.id === optionId);
}
