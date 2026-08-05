import type { CarData } from './car.model';

const documentIdPrefix = 'car-';
const documentIdHashLength = 20;

/**
 * Produces the stable representation used to decide whether two cars are duplicates.
 * Keep this browser-safe because it is shared by the Angular app and the CSV importer.
 */
export function createCanonicalCarIdentity(car: CarData): string {
  return JSON.stringify([
    normalizeCarName(car.name),
    car.mpg,
    car.cylinders,
    car.displacement,
    car.horsepower,
    car.weight,
    car.acceleration,
    car.modelYear,
    car.origin,
  ]);
}

/** Creates the same deterministic Firestore document ID as the Node.js importer. */
export async function createCarDocumentId(car: CarData): Promise<string> {
  const identityBytes = new TextEncoder().encode(createCanonicalCarIdentity(car));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', identityBytes);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return `${documentIdPrefix}${hash.slice(0, documentIdHashLength)}`;
}

export function normalizeCarName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}
