import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'soxy-invoices.db';
const DATABASE_VERSION = 1;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

/** Opens the local database once and reuses the connection everywhere. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).catch((error: unknown) => {
      // Drop a failed connection promise so the boot screen's retry can work.
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  // WAL improves reliability for a small, write-heavy local database.
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    if (currentVersion < 1) {
      await txn.execAsync(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          services TEXT NOT NULL,
          transport_fee REAL NOT NULL DEFAULT 0,
          grand_total REAL NOT NULL DEFAULT 0,
          downpayment_required REAL NOT NULL DEFAULT 0,
          amount_paid REAL NOT NULL DEFAULT 0,
          balance REAL NOT NULL DEFAULT 0,
          payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_invoices_date
          ON invoices (date DESC);

        CREATE INDEX IF NOT EXISTS idx_invoices_status
          ON invoices (payment_status);
      `);
    }

    await txn.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });
}

/** Safe to call multiple times; failed attempts can be retried. */
export async function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = runMigrations().catch((error: unknown) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}
