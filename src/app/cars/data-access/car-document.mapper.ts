import type { Car } from '../models/car.model';
import type { CarDocument } from './car-document.model';

export function mapCarDocument(id: string, document: CarDocument): Car {
  return {
    id,
    ...document,
    createdAt: document.createdAt?.toDate() ?? null,
    updatedAt: document.updatedAt?.toDate() ?? null,
  };
}
