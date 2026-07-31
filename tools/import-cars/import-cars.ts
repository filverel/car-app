import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  applicationDefault,
  deleteApp,
  initializeApp,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { parse } from 'csv-parse/sync';

import { firebaseConfig } from '../../src/app/firebase.config';
import type { CarData } from '../../src/app/cars/models/car.model';
import type { AutomobileSourceRow } from '../../src/app/cars/models/automobile-source-row.model';
import { normalizeAutomobileSourceRow } from '../../src/app/cars/models/automobile-source-row.normalizer';
import { createCarDocumentId } from './car-document-id';

const firestoreEmulatorHost = '127.0.0.1:8080';
const batchSize = 400;

const expectedHeaders = [
  'name',
  'mpg',
  'cylinders',
  'displacement',
  'horsepower',
  'weight',
  'acceleration',
  'model_year',
  'origin',
] as const;

type ImportMode = 'dry-run' | 'emulator' | 'production';

interface FailedRow {
  readonly rowNumber: number;
  readonly errors: readonly string[];
}

interface ImportDocument {
  readonly id: string;
  readonly car: CarData;
}

async function main(): Promise<void> {
  const csvPath = process.argv[2];
  const options = process.argv.slice(3);

  if (!csvPath) {
    throw usageError();
  }

  const mode = parseMode(options);
  const resolvedCsvPath = resolve(csvPath);
  const csvText = await readFile(resolvedCsvPath, 'utf8');
  const rows = parseRows(csvText);

  if (rows.length === 0) {
    throw new Error('The CSV contains no data rows.');
  }

  const validCars: CarData[] = [];
  const failedRows: FailedRow[] = [];

  rows.forEach((row, index) => {
    const result = normalizeAutomobileSourceRow(row);

    if (result.ok) {
      validCars.push(result.value);
      return;
    }

    failedRows.push({
      rowNumber: index + 2,
      errors: result.errors,
    });
  });

  console.log(`CSV file: ${resolvedCsvPath}`);
  console.log(`Rows read: ${rows.length}`);
  console.log(`Valid rows: ${validCars.length}`);
  console.log(`Invalid rows: ${failedRows.length}`);

  if (failedRows.length > 0) {
    console.error('\nValidation failures:');

    failedRows.forEach(({ rowNumber, errors }) => {
      console.error(`Row ${rowNumber}: ${errors.join('; ')}`);
    });

    process.exitCode = 1;
    return;
  }

  if (mode === 'dry-run') {
    console.log('\nDry run complete. No data was written.');
    return;
  }

  const collectionCount =
    mode === 'emulator'
      ? await importIntoEmulator(validCars)
      : await importIntoProduction(validCars);

  const destination =
    mode === 'emulator' ? 'emulator' : 'production';

  console.log(`\nDocuments processed: ${validCars.length}`);
  console.log(`Cars currently in ${destination}: ${collectionCount}`);
  console.log(`${capitalize(destination)} import complete.`);
}

function parseMode(options: readonly string[]): ImportMode {
  if (options.length === 1) {
    switch (options[0]) {
      case '--dry-run':
        return 'dry-run';

      case '--emulator':
        return 'emulator';
    }
  }

  const expectedConfirmation =
    `--confirm-project=${firebaseConfig.projectId}`;

  if (
    options.length === 2 &&
    options[0] === '--production' &&
    options[1] === expectedConfirmation
  ) {
    return 'production';
  }

  throw usageError();
}

function usageError(): Error {
  return new Error(
    [
      'Usage:',
      '  npm run import:cars -- <csv-path> --dry-run',
      '  npm run import:cars -- <csv-path> --emulator',
      `  npm run import:cars -- <csv-path> --production --confirm-project=${firebaseConfig.projectId}`,
    ].join('\n'),
  );
}

function parseRows(csvText: string): AutomobileSourceRow[] {
  return parse(csvText, {
    bom: true,
    columns: (headers: string[]) => {
      validateHeaders(headers);
      return headers;
    },
    skip_empty_lines: true,
  }) as AutomobileSourceRow[];
}

function validateHeaders(headers: readonly string[]): void {
  const headersMatch =
    headers.length === expectedHeaders.length &&
    expectedHeaders.every((expectedHeader, index) => headers[index] === expectedHeader);

  if (headersMatch) {
    return;
  }

  throw new Error(
    [
      'Unexpected CSV headers.',
      `Expected: ${expectedHeaders.join(',')}`,
      `Received: ${headers.join(',')}`,
    ].join('\n'),
  );
}

async function importIntoEmulator(cars: readonly CarData[]): Promise<number> {
  process.env['FIRESTORE_EMULATOR_HOST'] = firestoreEmulatorHost;

  const app = initializeApp({
    projectId: firebaseConfig.projectId,
  });

  try {
    const firestore = getFirestore(app);
    const documents = createImportDocuments(cars);

    await writeDocuments(firestore, documents);

    const countSnapshot = await firestore.collection('cars').count().get();

    return countSnapshot.data().count;
  } finally {
    await deleteApp(app);
  }
}

async function importIntoProduction(cars: readonly CarData[]): Promise<number> {
  if (process.env['FIRESTORE_EMULATOR_HOST']) {
    throw new Error(
      'Production import refused because FIRESTORE_EMULATOR_HOST is set.',
    );
  }

  const app = initializeApp({
    credential: applicationDefault(),
    projectId: firebaseConfig.projectId,
  });

  try {
    const firestore = getFirestore(app);
    const documents = createImportDocuments(cars);

    await writeDocuments(firestore, documents);

    const countSnapshot = await firestore.collection('cars').count().get();

    return countSnapshot.data().count;
  } finally {
    await deleteApp(app);
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createImportDocuments(cars: readonly CarData[]): readonly ImportDocument[] {
  const documents = cars.map((car) => ({
    id: createCarDocumentId(car),
    car,
  }));

  const uniqueIds = new Set(documents.map((document) => document.id));

  if (uniqueIds.size !== documents.length) {
    throw new Error('Two or more normalized cars produced the same document ID.');
  }

  return documents;
}

async function writeDocuments(
  firestore: Firestore,
  documents: readonly ImportDocument[],
): Promise<void> {
  for (let offset = 0; offset < documents.length; offset += batchSize) {
    const batch = firestore.batch();
    const currentBatch = documents.slice(offset, offset + batchSize);

    currentBatch.forEach(({ id, car }) => {
      const documentReference = firestore.collection('cars').doc(id);

      batch.set(documentReference, {
        ...car,
        createdAt: null,
        updatedAt: null,
      });
    });

    await batch.commit();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
