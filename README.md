# Soxy Cleaning Services — Invoice Manager

A cross-platform invoice app for **Soxy Cleaning Services**, built with React Native, Expo, and TypeScript. It recreates the workflow of the original web app as a fast, offline-first mobile tool for creating invoices, recording payments, and sharing polished A4 PDF receipts or branded invoice images.

The app targets **iOS and Android** and runs in **Expo Go** (SDK 58).

## Highlights

- Create an invoice with Soxy's full service catalog and live totals.
- Override any service's unit price for a specific invoice without changing the catalog.
- Edit the services and prices of saved invoices, with totals and payment status recalculated immediately.
- Automatic **20% downpayment** calculation with a separate **deposit status** badge (`Deposit due`, `Deposit short`, `Deposit received`, `Paid in full`) so a booking deposit is never confused with full payment.
- Record the customer's phone number plus the job's service address, schedule, and notes on the invoice.
- Record an initial or later payment and see the balance and payment status update instantly.
- Save invoices locally in **Expo SQLite** — no account or internet connection required.
- Search and filter invoice history by customer, address, invoice ID, or payment status — including a **Deposit due** filter.
- Share a professional A4 PDF, share a branded invoice PNG, open the native print dialog, or export a complete JSON backup.
- Branded theme, app icon, splash screen, and mobile-first layouts.
- Fully typed data model and calculation utilities with unit tests.

## Getting started

### Requirements

- Node.js 20 or newer (tested with Node 24)
- npm
- [Expo Go](https://expo.dev/go) on a physical iOS or Android device, or a configured simulator/emulator

### Run the app

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. The app's SDK 58 project should be opened with an Expo Go version that supports SDK 58.

Useful variants:

```bash
npx expo start --clear   # clear the Metro cache
npm run android          # open on a connected Android environment
npm run ios              # macOS + iOS simulator only
```

### Checks

```bash
npm run typecheck
npm test
npx expo-doctor
```

## Features in detail

### Invoice creator

- Customer name with validation and a character counter.
- Optional job details tucked behind an expander so quick invoices stay short:
  - Customer phone number (30 characters)
  - Service schedule (80 characters), e.g. `Fri, 9:00 AM`
  - Service address (180 characters, multi-line)
  - Service notes (300 characters, multi-line) for access, parking, or cleaning notes
  - Phone and schedule are printed reminders only — the app does not send SMS or notifications.
- Expandable service menu:
  - Cleaning Sessions
  - Furniture, Chairs & Pillows
  - Mattresses
  - Add-ons
- Per-item quantity controls, with **0.5-hour increments for overtime**.
- Add and edit service lines, including a **per-invoice unit-price override**. The catalog price remains the default reference for future invoices.
- Reset an edited price back to its catalog price with one tap.
- Service names stay catalog-defined; there is no free-form service entry.
- Optional transportation fee.
- Live services subtotal, grand total, 20% downpayment, balance, payment badge, and deposit status badge.
- Quick payment chips: **Use 20% downpayment** and **Paid in full**.
- Sticky bottom bar with grand total, deposit amount, and **Save & Publish Invoice**.
- Print/Share actions save the invoice first, so every generated receipt or image also exists in history.
- Reset confirmation clears unsaved input.
- Validation prevents saving without a customer or billable amount, and prevents overpayment.

### Invoice history

- Newest-first cards with invoice ID, customer name, date, schedule, address, phone, total, editable amount paid, balance, a payment status badge, and a separate deposit status badge:
  - **PAID** — green
  - **PARTIAL** — yellow
  - **UNPAID** — red
  - Deposit: **Deposit due** / **Deposit short** / **Deposit received** / **Paid in full**
- Inline payment editing with auto-save on blur and a save button. Balance, badge, and payment progress update as you type.
- **Edit services** on any saved invoice: change quantities, cleaning levels, or unit prices, and add or remove service lines.
- Editing a saved invoice recalculates its subtotal, grand total, 20% downpayment, balance, and payment status. The updated values flow straight into the PDF, shared image, and JSON backup.
- Saving price changes is blocked if the new total would be lower than the amount already paid. Reduce the recorded payment first.
- Search by customer name, customer phone, service address, or invoice ID.
- Filter by All / Deposit due / Unpaid / Partial / Paid.
- Pull to refresh.
- Per-invoice actions: Edit services, Share PDF, Share image, Print, Delete (with confirmation).
- Header actions: Export all data as JSON and Clear all invoices (with confirmation).
- Empty states for both a brand-new invoice book and filtered searches with no results.

## Pricing catalog

Prices are defined in `src/constants/catalog.ts`.

| Service | Price |
| --- | --- |
| 5-Hour Cleaning Session | ₱1,099 |
| 6-Hour Cleaning Session | ₱1,299 / person |
| Overtime | ₱200 / hour, in 0.5-hour increments |
| Grease Trap Cleaning | ₱400 |
| Refrigerator Cleaning | Standard ₱399 · Deep ₱499 |
| 2-Seater Sofa | ₱1,300 |
| 3-Seater Sofa | ₱1,500 |
| 4-Seater Sofa | ₱2,000 |
| 4-Seater Sofa with Pull-Out | ₱2,500 |
| Single / Twin Mattress | Standard ₱900 · Deep ₱1,050 · Premium ₱1,200 |
| Queen Mattress | Standard ₱1,500 · Deep ₱1,750 · Premium ₱2,000 |
| King Mattress | Standard ₱1,800 · Deep ₱2,150 · Premium ₱2,500 |
| Dining Chair | Standard ₱250 · Deep ₱325 · Premium ₱400 |
| Office / Executive Chair | Standard ₱250 · Deep ₱375 · Premium ₱500 |
| Pillow Cleaning | Standard ₱85 · Deep ₱120 · Premium ₱150 |
| Transportation | Manual amount per invoice |

Tiered items use **Standard / Deep / Premium** in ascending price order. The selected tier appears on the invoice card and PDF.

Catalog prices are defaults. Changing a unit price in the invoice creator or while editing a saved invoice only affects that invoice; it never writes back to `src/constants/catalog.ts` or changes the price used by future invoices.

## Business information

The placeholder company contact details, payment terms, monogram, and invoice footer live in:

```text
src/constants/business.ts
```

Replace the phone number, email, address, and website with the real Soxy details before distributing the app. The invoice PDF and image use the same file.

Other customization points:

- `src/constants/theme.ts` — brand colors and status badge styles
- `src/constants/pricing.ts` — downpayment rate and form limits
- `src/constants/catalog.ts` — services, tiers, units, and prices
- `assets/` — app icon, adaptive Android foreground/monochrome icon, favicon, and splash logo

## Calculations and payment status

All invoice math lives in `src/utils/calculations.ts`:

```text
line total       = per-invoice unit price × quantity
services subtotal = sum of line totals
grand total      = services subtotal + transportation fee
downpayment      = 20% of grand total
balance          = grand total − amount paid
```

- Money is rounded to centavos at each calculation boundary.
- A per-invoice unit-price override replaces the catalog price for that line only. Recalculating a saved invoice uses the same rules as creating a new one.
- Amounts are displayed with comma grouping and use `₱`. Centavos are shown only when present, except on the PDF and shared image where every monetary value uses two decimals.
- `PAID`: amount paid is at least the grand total
- `PARTIAL`: something has been paid but the balance remains
- `UNPAID`: nothing has been paid
- Balances never go below zero. Validation prevents overpayments from being saved.
- The 20% downpayment does not automatically mark the invoice as paid.

### Deposit status

`getDepositStatus` is separate from the payment status because a booking is confirmed by the deposit, not by the first peso collected. A ₱200 part-payment on a ₱5,000 invoice is `PARTIAL` but still `Deposit due`.

| Deposit status | When |
| --- | --- |
| `deposit-due` | Nothing has been paid yet |
| `deposit-short` | Something has been paid, but less than the 20% downpayment |
| `deposit-received` | The 20% downpayment has been covered |
| `paid-in-full` | The amount paid covers the grand total |

`getDepositShortfall` returns the remaining amount before the deposit is covered, and the invoice HTML prints one of four customer-facing messages based on the same status.

## Data and privacy

Invoices are stored in a local SQLite database named `soxy-invoices.db`.

- There is no backend, authentication, analytics, or cloud sync.
- Data stays on the device until the app is uninstalled or invoices are cleared.
- **Export all data (JSON)** produces a complete backup with app version, schema version, export timestamp, and all invoices.
- **Clear all invoices** permanently deletes every invoice in the local database. Export a backup first if the records may be needed.
- The database schema uses `PRAGMA user_version` so future migrations can be added safely in `src/db/database.ts`.
- **Schema version 2** adds optional customer phone, service address, service schedule, and service notes to each invoice. Existing invoices are migrated in place with empty values; no rows are dropped.

## PDF, images, and printing

- `src/templates/invoiceHtml.ts` builds the self-contained invoice document.
- `src/services/pdfService.ts` generates and shares an A4 PDF with `expo-print` and `expo-sharing`.
- `src/components/invoices/InvoiceImageSheet.tsx` builds a branded, mobile-readable receipt image with every service line and payment total.
- `src/components/invoices/InvoiceImageShareModal.tsx` captures that sheet as a PNG with `react-native-view-shot` and opens the share sheet.
- `src/services/imageService.ts` writes the captured PNG into the scoped Expo File System cache before sharing, avoiding Expo Go's file-permission restrictions.
- The native print dialog is opened with `expo-print`.
- A4 dimensions are passed explicitly because Expo Print defaults to US Letter.
- The PDF sheet uses percentage-based inner padding, so it keeps safe page margins even in print engines that ignore CSS `@page` margins.
- The PDF prints a deposit-specific message ("downpayment required", "partial payment received, X more needed", "booking deposit received", or "paid in full") and a **Service details** section listing phone, schedule, address, and notes when present.
- All customer-entered values are HTML-escaped before printing.
- Print/Share requires the invoice to be saved first. This guarantees a receipt or image remains available in history.
- Printing and sharing depend on the device's available print services and share targets. Test these flows on a physical phone.

## Project structure

```text
.
|-- App.tsx
|-- app.json
|-- eas.json                    # EAS build profiles (development / preview / production)
|-- index.ts
|-- assets/
|-- src/
|   |-- __tests__/               # Calculation, money, validation, catalog, PDF, and image tests
|   |-- components/
|   |   |-- creator/             # Customer, catalog, selected services, payment, footer, editor
|   |   |-- invoices/            # History card, services editor, image sheet, and image share modal
|   |   |-- AmountInput.tsx
|   |   |-- DepositStatusBadge.tsx
|   |   |-- EmptyState.tsx
|   |   |-- SectionCard.tsx
|   |   `-- StatusBadge.tsx
|   |-- constants/
|   |   |-- business.ts
|   |   |-- catalog.ts
|   |   |-- pricing.ts
|   |   `-- theme.ts
|   |-- db/
|   |   |-- database.ts          # Singleton connection + migrations
|   |   `-- invoiceRepository.ts # Typed CRUD
|   |-- hooks/
|   |   `-- useInvoiceDraft.ts
|   |-- navigation/
|   |   |-- RootNavigator.tsx
|   |   `-- types.ts
|   |-- providers/
|   |   `-- InvoicesProvider.tsx # Loads SQLite and exposes invoice actions
|   |-- screens/
|   |   |-- InvoiceCreatorScreen.tsx
|   |   `-- InvoiceListScreen.tsx
|   |-- services/
|   |   |-- exportService.ts
|   |   |-- imageService.ts
|   |   `-- pdfService.ts
|   |-- templates/
|   |   `-- invoiceHtml.ts
|   |-- types/
|   |   |-- catalog.ts
|   |   |-- icons.ts
|   |   `-- invoice.ts
|   `-- utils/
|       |-- calculations.ts
|       |-- date.ts
|       |-- errors.ts
|       |-- html.ts
|       |-- ids.ts
|       |-- invoiceUpdates.ts    # Saved-invoice recalculation + payment guard
|       |-- money.ts
|       |-- services.ts
|       `-- validation.ts
|-- package.json
`-- tsconfig.json
```

## Tech stack

- Expo SDK 58 / React Native 0.88 / React 19
- TypeScript 6 in strict mode
- React Navigation 7 bottom tabs
- React Native Paper 5 (Material Design 3 light theme)
- Expo SQLite
- Expo Print + Expo Sharing
- React Native View Shot for invoice image capture
- Expo File System for scoped PDF/image files and JSON backups
- Expo Splash Screen for the branded native splash screen
- Jest + jest-expo for calculation, service, and template tests

## Standalone builds

The project is ready for Expo Application Services (EAS) or local native builds. `eas.json` defines three profiles: `development` (dev client, internal distribution), `preview` (internal distribution), and `production` (auto-incrementing version).

```bash
npx expo prebuild
npx expo run:android
# or, with EAS:
npx eas-cli build --platform all --profile production
```

The bundle identifiers are already set in `app.json`:

- iOS: `com.soxy.cleaninginvoices`
- Android: `com.soxy.cleaninginvoices`

## Known limitations (v1)

- Local-only storage; no cloud sync or multi-device access.
- No authentication or user roles.
- Service names and categories come from the built-in catalog; only quantity, tier, and unit price can be edited.
- Customer phone, service address, schedule, and notes are free-form text. They are printed reminders only — the app does not send SMS, notifications, or reminders, and the fields are not validated as phone numbers or dates.
- Invoice dates are generated automatically when saved.
- Printing, image capture, and share-sheet behavior cannot be fully exercised in Expo Go without a physical device.
