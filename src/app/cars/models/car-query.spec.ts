import { describe, expect, it } from 'vitest';

import type { Car } from './car.model';
import type { CarQuery } from './car-query.model';
import { applyCarQuery } from './car-query';

const defaultQuery: CarQuery = {
  searchTerm: '',
  origin: 'all',
  sortBy: 'name',
  sortDirection: 'ascending',
};

function createCar(overrides: Partial<Car>): Car {
  return {
    id: 'car-default',
    name: 'default car',
    mpg: 20,
    cylinders: 4,
    displacement: 100,
    horsepower: 80,
    weight: 2000,
    acceleration: 15,
    modelYear: 1970,
    origin: 'usa',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('applyCarQuery', () => {
  const cars: readonly Car[] = [
    createCar({
      id: 'car-1',
      name: 'Ford Pinto',
      modelYear: 1971,
      origin: 'usa',
      mpg: 25,
      horsepower: 75,
    }),
    createCar({
      id: 'car-2',
      name: 'Toyota Corolla',
      modelYear: 1980,
      origin: 'japan',
      mpg: 32,
      horsepower: 65,
    }),
    createCar({
      id: 'car-3',
      name: 'Volkswagen Rabbit',
      modelYear: 1976,
      origin: 'europe',
      mpg: null,
      horsepower: null,
    }),
  ];

  it('searches names without considering case or surrounding whitespace', () => {
    const result = applyCarQuery(cars, {
      ...defaultQuery,
      searchTerm: '  TOYOTA  ',
    });

    expect(result.map((car) => car.id)).toEqual(['car-2']);
  });

  it('filters cars by origin', () => {
    const result = applyCarQuery(cars, {
      ...defaultQuery,
      origin: 'europe',
    });

    expect(result.map((car) => car.id)).toEqual(['car-3']);
  });

  it('combines search and origin filters', () => {
    const result = applyCarQuery(cars, {
      ...defaultQuery,
      searchTerm: 'ford',
      origin: 'japan',
    });

    expect(result).toEqual([]);
  });

  it('sorts in descending order', () => {
    const result = applyCarQuery(cars, {
      ...defaultQuery,
      sortBy: 'modelYear',
      sortDirection: 'descending',
    });

    expect(result.map((car) => car.id)).toEqual(['car-2', 'car-3', 'car-1']);
  });

  it('places unavailable numeric values last', () => {
    const result = applyCarQuery(cars, {
      ...defaultQuery,
      sortBy: 'mpg',
      sortDirection: 'descending',
    });

    expect(result.map((car) => car.id)).toEqual(['car-2', 'car-1', 'car-3']);
  });

  it('does not mutate the source collection', () => {
    const originalOrder = cars.map((car) => car.id);

    applyCarQuery(cars, {
      ...defaultQuery,
      sortBy: 'modelYear',
      sortDirection: 'descending',
    });

    expect(cars.map((car) => car.id)).toEqual(originalOrder);
  });
});
