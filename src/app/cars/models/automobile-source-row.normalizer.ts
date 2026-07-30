import type { CarData, CarOrigin } from './car.model';
import type { AutomobileSourceRow } from './automobile-source-row.model';

export type AutomobileSourceRowNormalizationResult =
  | {
      readonly ok: true;
      readonly value: CarData;
    }
  | {
      readonly ok: false;
      readonly errors: readonly string[];
    };

const missingValues = new Set(['', '?', 'null', 'n/a', 'na']);

export function normalizeAutomobileSourceRow(
  row: AutomobileSourceRow,
): AutomobileSourceRowNormalizationResult {
  const errors: string[] = [];

  const name = toTrimmedString(row.Name);

  if (!name) {
    errors.push('Name is required');
  }

  const mpg = parseOptionalNumber(row.MPG, 'MPG', errors);
  const cylinders = parseRequiredNumber(row.Cylinders, 'Cylinders', errors);
  const displacement = parseOptionalNumber(row.Displacement, 'Displacement', errors);
  const horsepower = parseOptionalNumber(row.Horsepower, 'Horsepower', errors);
  const weight = parseOptionalNumber(row.Weight, 'Weight', errors);
  const acceleration = parseOptionalNumber(row.Acceleration, 'Acceleration', errors);

  const sourceModelYear = parseRequiredNumber(row['Model Year'], 'Model Year', errors);

  const modelYear =
    sourceModelYear !== null && sourceModelYear <= 99 ? sourceModelYear + 1900 : sourceModelYear;

  const origin = normalizeOrigin(row.Origin);

  if (errors.length > 0 || cylinders === null || modelYear === null) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: {
      name,
      mpg,
      cylinders,
      displacement,
      horsepower,
      weight,
      acceleration,
      modelYear,
      origin,
    },
  };
}

function toTrimmedString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function parseRequiredNumber(value: unknown, fieldName: string, errors: string[]): number | null {
  const text = toTrimmedString(value);
  const parsedValue = Number(text);

  if (!text || !Number.isFinite(parsedValue)) {
    errors.push(`${fieldName} must be a number`);
    return null;
  }

  return parsedValue;
}

function parseOptionalNumber(value: unknown, fieldName: string, errors: string[]): number | null {
  const text = toTrimmedString(value);

  if (missingValues.has(text.toLowerCase())) {
    return null;
  }

  const parsedValue = Number(text);

  if (!Number.isFinite(parsedValue)) {
    errors.push(`${fieldName} must be a number or a missing value`);
    return null;
  }

  return parsedValue;
}

function normalizeOrigin(value: unknown): CarOrigin {
  switch (toTrimmedString(value).toLowerCase()) {
    case '1':
    case 'usa':
      return 'usa';

    case '2':
    case 'europe':
      return 'europe';

    case '3':
    case 'japan':
      return 'japan';

    default:
      return 'other';
  }
}
