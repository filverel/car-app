import {
  inject,
  Injectable,
  InjectionToken,
} from '@angular/core';

import { DEFAULT_CAR_QUERY } from '../models/car-query.model';
import type {
  CarOriginFilter,
  CarQuery,
  CarSortField,
  SortDirection,
} from '../models/car-query.model';

export const CAR_QUERY_STORAGE_KEY = 'car-app:car-query:v1';

export const CAR_QUERY_STORAGE = new InjectionToken<Storage>(
  'CAR_QUERY_STORAGE',
  {
    providedIn: 'root',
    factory: () => localStorage,
  },
);

@Injectable({
  providedIn: 'root',
})
export class CarQueryStorage {
  private readonly storage = inject(CAR_QUERY_STORAGE);

  load(): CarQuery {
    try {
      const serializedQuery = this.storage.getItem(
        CAR_QUERY_STORAGE_KEY,
      );

      if (serializedQuery === null) {
        return DEFAULT_CAR_QUERY;
      }

      const candidate: unknown = JSON.parse(serializedQuery);

      return isCarQuery(candidate)
        ? candidate
        : DEFAULT_CAR_QUERY;
    } catch {
      return DEFAULT_CAR_QUERY;
    }
  }

  save(query: CarQuery): void {
    try {
      this.storage.setItem(
        CAR_QUERY_STORAGE_KEY,
        JSON.stringify(query),
      );
    } catch {
      // Storage failures must not prevent the collection from working.
    }
  }
}

function isCarQuery(value: unknown): value is CarQuery {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['searchTerm'] === 'string' &&
    isCarOriginFilter(value['origin']) &&
    isCarSortField(value['sortBy']) &&
    isSortDirection(value['sortDirection'])
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCarOriginFilter(
  value: unknown,
): value is CarOriginFilter {
  return (
    value === 'all' ||
    value === 'usa' ||
    value === 'europe' ||
    value === 'japan' ||
    value === 'other'
  );
}

function isCarSortField(value: unknown): value is CarSortField {
  return (
    value === 'name' ||
    value === 'modelYear' ||
    value === 'origin' ||
    value === 'mpg' ||
    value === 'cylinders' ||
    value === 'horsepower'
  );
}

function isSortDirection(
  value: unknown,
): value is SortDirection {
  return value === 'ascending' || value === 'descending';
}
