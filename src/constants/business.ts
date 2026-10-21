/**
 * Business details used across the app and on the printed invoice.
 * Replace the placeholder contact information with the real Soxy details.
 */
export const BUSINESS_INFO = {
  name: 'Soxy Cleaning Services',
  tagline: 'Professional Cleaning Services',
  phone: '+63 917 000 0000',
  email: 'hello@soxycleaning.ph',
  address: 'Metro Manila, Philippines',
  website: 'soxycleaning.ph',
  monogram: 'S',
  invoiceFooter: 'Thank you for choosing Soxy Cleaning Services!',
  paymentTerms:
    'A 20% downpayment is required to confirm your booking. The remaining balance is due upon completion of the service.',
} as const;
