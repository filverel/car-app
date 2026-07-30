import { Timestamp } from '@angular/fire/firestore';

import { mapCarDocument } from './car-document.mapper';

describe('mapCarDocument', () => {
  const storedFields = {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa' as const,
  };

  it('maps a Firestore document into a car', () => {
    const createdAt = new Date('2026-07-30T10:00:00.000Z');
    const updatedAt = new Date('2026-07-30T11:00:00.000Z');

    const result = mapCarDocument('car-123', {
      ...storedFields,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(updatedAt),
    });

    expect(result).toEqual({
      id: 'car-123',
      ...storedFields,
      createdAt,
      updatedAt,
    });
  });

  it('preserves unresolved or unavailable timestamps as null', () => {
    const result = mapCarDocument('car-456', {
      ...storedFields,
      createdAt: null,
      updatedAt: null,
    });

    expect(result.createdAt).toBeNull();
    expect(result.updatedAt).toBeNull();
  });
});
