import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parse } from 'csv-parse/sync';

import type { AutomobileSourceRow } from '../../src/app/cars/models/automobile-source-row.model';
import { normalizeAutomobileSourceRow } from '../../src/app/cars/models/automobile-source-row.normalizer';

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

interface FailedRow {
  readonly rowNumber: number;
  readonly errors: readonly string[];
}

async function main(): Promise<void> {
  const csvPath = process.argv[2];
  const options = process.argv.slice(3);

  if (!csvPath || !options.includes('--dry-run')) {
    throw new Error('Usage: npm run import:cars -- <csv-path> --dry-run');
  }

  const resolvedCsvPath = resolve(csvPath);
  const csvText = await readFile(resolvedCsvPath, 'utf8');
  const rows = parseRows(csvText);

  const validCars = [];
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

  console.log('\nDry run complete. No data was written.');
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

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
