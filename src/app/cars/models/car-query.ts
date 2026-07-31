import type { Car } from './car.model';
import type { CarQuery, SortDirection } from './car-query.model';

export function applyCarQuery(cars: readonly Car[], query: CarQuery): readonly Car[] {
  const normalizedSearchTerm = query.searchTerm.trim().toLocaleLowerCase();

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      car.name.toLocaleLowerCase().includes(normalizedSearchTerm);

    const matchesOrigin = query.origin === 'all' || car.origin === query.origin;

    return matchesSearch && matchesOrigin;
  });

  return [...filteredCars].sort((left, right) => {
    const direction = query.sortDirection === 'ascending' ? 1 : -1;

    switch (query.sortBy) {
      case 'name':
        return left.name.localeCompare(right.name) * direction;

      case 'modelYear':
        return (left.modelYear - right.modelYear) * direction;

      case 'origin':
        return left.origin.localeCompare(right.origin) * direction;

      case 'mpg':
        return compareNullableNumbers(left.mpg, right.mpg, query.sortDirection);

      case 'cylinders':
        return (left.cylinders - right.cylinders) * direction;

      case 'horsepower':
        return compareNullableNumbers(left.horsepower, right.horsepower, query.sortDirection);
    }
  });
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: SortDirection,
): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  const multiplier = direction === 'ascending' ? 1 : -1;
  return (left - right) * multiplier;
}
