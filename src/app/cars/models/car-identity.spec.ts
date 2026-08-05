import type { CarData } from './car.model';
import { createCanonicalCarIdentity, createCarDocumentId } from './car-identity';

describe('car identity', () => {
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

  describe('createCanonicalCarIdentity', () => {
    it('returns the same identity for identical car data', () => {
      expect(createCanonicalCarIdentity(car)).toBe(createCanonicalCarIdentity({ ...car }));
    });

    it('ignores capitalization and insignificant whitespace in the name', () => {
      const differentlyFormattedCar: CarData = {
        ...car,
        name: '  Chevrolet   Chevelle\tMalibu  ',
      };

      expect(createCanonicalCarIdentity(differentlyFormattedCar)).toBe(
        createCanonicalCarIdentity(car),
      );
    });

    it('returns a different identity when meaningful car data changes', () => {
      expect(createCanonicalCarIdentity({ ...car, modelYear: 1971 })).not.toBe(
        createCanonicalCarIdentity(car),
      );
    });
  });

  describe('createCarDocumentId', () => {
    it('matches the ID already produced by the importer', async () => {
      await expect(createCarDocumentId(car)).resolves.toBe('car-501523512cba2441db9d');
    });

    it('returns the same ID for equivalent normalized car data', async () => {
      const differentlyFormattedCar: CarData = {
        ...car,
        name: '  Chevrolet   Chevelle Malibu ',
      };

      await expect(createCarDocumentId(differentlyFormattedCar)).resolves.toBe(
        await createCarDocumentId(car),
      );
    });

    it('returns a Firestore-safe ID', async () => {
      const id = await createCarDocumentId(car);

      expect(id).toMatch(/^car-[a-f0-9]{20}$/);
      expect(id).not.toContain('/');
    });
  });
});
