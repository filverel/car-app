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

  const name = toTrimmedString(row.name);

  if (!name) {
    errors.push('Name is required');
  }

  const mpg = parseOptionalNumber(row.mpg, 'MPG', errors);
  const cylinders = parseRequiredNumber(row.cylinders, 'Cylinders', errors);
  const displacement = parseOptionalNumber(row.displacement, 'Displacement', errors);
  const horsepower = parseOptionalNumber(row.horsepower, 'Horsepower', errors);
  const weight = parseOptionalNumber(row.weight, 'Weight', errors);
  const acceleration = parseOptionalNumber(row.acceleration, 'Acceleration', errors);

  const sourceModelYear = parseRequiredNumber(row.model_year, 'Model Year', errors);

  const modelYear =
    sourceModelYear !== null && sourceModelYear <= 99 ? sourceModelYear + 1900 : sourceModelYear;

  const origin = normalizeOrigin(row.origin);

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
