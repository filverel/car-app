import type { CarOrigin } from './car.model';

export type CarOriginFilter = CarOrigin | 'all';

export type CarSortField =
  | 'name'
  | 'modelYear'
  | 'origin'
  | 'mpg'
  | 'cylinders'
  | 'horsepower';

export type SortDirection = 'ascending' | 'descending';

export interface CarQuery {
  readonly searchTerm: string;
  readonly origin: CarOriginFilter;
  readonly sortBy: CarSortField;
  readonly sortDirection: SortDirection;
}

export const DEFAULT_CAR_QUERY: CarQuery = {
  searchTerm: '',
  origin: 'all',
  sortBy: 'name',
  sortDirection: 'ascending',
};
