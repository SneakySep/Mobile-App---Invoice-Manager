/** Shared business rules for pricing and invoice forms. */
export const DOWNPAYMENT_RATE = 0.2;
/** Human-readable deposit percentage derived from DOWNPAYMENT_RATE (e.g. "20%"). */
export const DOWNPAYMENT_PERCENT_LABEL = `${Math.round(DOWNPAYMENT_RATE * 100)}%`;
export const MAX_CUSTOMER_NAME_LENGTH = 80;
export const MAX_CUSTOMER_PHONE_LENGTH = 30;
export const MAX_SERVICE_ADDRESS_LENGTH = 180;
export const MAX_SCHEDULE_LENGTH = 80;
export const MAX_SERVICE_NOTES_LENGTH = 300;
export const MAX_LINE_QUANTITY = 99;
export const MAX_MONEY_INPUT = 999_999.99;
export const DEFAULT_QUANTITY_STEP = 1;
