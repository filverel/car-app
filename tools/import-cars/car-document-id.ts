import { createHash } from 'node:crypto';

import type { CarData } from '../../src/app/cars/models/car.model';

export function createCarDocumentId(car: CarData): string {
  const canonicalCar = JSON.stringify([
    car.name,
    car.mpg,
    car.cylinders,
    car.displacement,
    car.horsepower,
    car.weight,
    car.acceleration,
    car.modelYear,
    car.origin,
  ]);

  const hash = createHash('sha256').update(canonicalCar).digest('hex').slice(0, 20);

  return `car-${hash}`;
}
