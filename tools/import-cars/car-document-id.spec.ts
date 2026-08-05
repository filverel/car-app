import { describe, expect, it } from 'vitest';

import type { CarData } from '../../src/app/cars/models/car.model';
import { createCarDocumentId } from './car-document-id';

describe('createCarDocumentId', () => {
  const car: CarData = {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
  };

  it('returns the same ID for identical car data', () => {
    const firstId = createCarDocumentId(car);
    const secondId = createCarDocumentId({ ...car });

    expect(firstId).toBe(secondId);
  });

  it('matches the ID of an existing imported document', () => {
    expect(createCarDocumentId(car)).toBe('car-501523512cba2441db9d');
  });

  it('ignores capitalization and insignificant whitespace in the name', () => {
    expect(
      createCarDocumentId({
        ...car,
        name: '  Chevrolet   Chevelle Malibu ',
      }),
    ).toBe(createCarDocumentId(car));
  });

  it('returns a different ID when the car data changes', () => {
    const firstId = createCarDocumentId(car);
    const secondId = createCarDocumentId({
      ...car,
      modelYear: 1971,
    });

    expect(firstId).not.toBe(secondId);
  });

  it('returns a Firestore-safe ID', () => {
    const id = createCarDocumentId(car);

    expect(id).toMatch(/^car-[a-f0-9]{20}$/);
    expect(id).not.toContain('/');
  });
});
