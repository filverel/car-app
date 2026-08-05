import { createHash } from 'node:crypto';

import type { CarData } from '../../src/app/cars/models/car.model';
import { createCanonicalCarIdentity } from '../../src/app/cars/models/car-identity';

export function createCarDocumentId(car: CarData): string {
  const hash = createHash('sha256')
    .update(createCanonicalCarIdentity(car))
    .digest('hex')
    .slice(0, 20);

  return `car-${hash}`;
}
