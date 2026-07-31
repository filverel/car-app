import type { Car } from './car.model';

const headers = [
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

export function serializeCarsToCsv(
  cars: readonly Car[],
): string {
  const rows: readonly (readonly CsvValue[])[] = [
    headers,
    ...cars.map((car) => [
      car.name,
      optionalNumber(car.mpg),
      car.cylinders,
      optionalNumber(car.displacement),
      optionalNumber(car.horsepower),
      optionalNumber(car.weight),
      optionalNumber(car.acceleration),
      car.modelYear,
      car.origin,
    ]),
  ];

  return `${rows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n')}\r\n`;
}

type CsvValue = string | number;

function optionalNumber(value: number | null): CsvValue {
  return value === null ? '?' : value;
}

function escapeCsvValue(value: CsvValue): string {
  const text = String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
