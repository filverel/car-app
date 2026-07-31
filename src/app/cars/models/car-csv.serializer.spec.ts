import { describe, expect, it } from 'vitest';

import type { Car } from './car.model';
import { serializeCarsToCsv } from './car-csv.serializer';

function createCar(overrides: Partial<Car> = {}): Car {
  return {
    id: 'car-1',
    name: 'Mazda RX-4',
    mpg: 21,
    cylinders: 4,
    displacement: 160,
    horsepower: 110,
    weight: 2200,
    acceleration: 16.5,
    modelYear: 1978,
    origin: 'japan',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('serializeCarsToCsv', () => {
  it('exports the importer-compatible headers and car fields', () => {
    const csv = serializeCarsToCsv([
      createCar({
        name: 'Mazda RX-4, "Special"',
        horsepower: null,
      }),
    ]);

    expect(csv).toBe(
      [
        'name,mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin',
        '"Mazda RX-4, ""Special""",21,4,160,?,2200,16.5,1978,japan',
        '',
      ].join('\r\n'),
    );
  });

  it('exports missing optional numbers using the importer missing-value marker', () => {
    const csv = serializeCarsToCsv([
      createCar({
        mpg: null,
        displacement: null,
        horsepower: null,
        weight: null,
        acceleration: null,
      }),
    ]);

    expect(csv).toContain(
      'Mazda RX-4,?,4,?,?,?,?,1978,japan',
    );
  });

  it('escapes line breaks in car names', () => {
    const csv = serializeCarsToCsv([
      createCar({
        name: 'Mazda\nRX-4',
      }),
    ]);

    expect(csv).toContain('"Mazda\nRX-4"');
  });

  it('exports only the header for an empty collection', () => {
    const csv = serializeCarsToCsv([]);

    expect(csv).toBe(
      [
        'name,mpg,cylinders,displacement,horsepower,weight,acceleration,model_year,origin',
        '',
      ].join('\r\n'),
    );
  });
});
