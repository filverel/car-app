import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { CarsRepository } from '../data-access/cars.repository';
import type { Car } from '../models/car.model';
import type { CarQuery } from '../models/car-query.model';
import { CarQueryStorage } from './car-query.storage';
import { CarsStore } from './cars.store';

describe('CarsStore', () => {
  let carsSource: Subject<readonly Car[]>;
  let storedQuery: CarQuery;
  let savedQuery: CarQuery | null;

  const car: Car = {
    id: 'car-1',
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
    createdAt: null,
    updatedAt: null,
  };

  const japaneseCar: Car = {
    ...car,
    id: 'car-2',
    name: 'toyota corolla',
    mpg: 32,
    modelYear: 1980,
    origin: 'japan',
  };

  beforeEach(() => {
    carsSource = new Subject<readonly Car[]>();
    storedQuery = {
      searchTerm: '',
      origin: 'all',
      sortBy: 'name',
      sortDirection: 'ascending',
    };
    savedQuery = null;

    TestBed.configureTestingModule({
      providers: [
        CarsStore,
        {
          provide: CarsRepository,
          useValue: {
            watchAll: () => carsSource.asObservable(),
          },
        },
        {
          provide: CarQueryStorage,
          useValue: {
            load: () => storedQuery,
            save: (query: CarQuery) => {
              savedQuery = query;
            },
          },
        },
      ],
    });
  });

  it('starts in a loading state', () => {
    const store = TestBed.inject(CarsStore);

    expect(store.cars()).toEqual([]);
    expect(store.isLoading()).toBe(true);
    expect(store.loadError()).toBeNull();
  });

  it('stores cars when the repository emits', () => {
    const store = TestBed.inject(CarsStore);

    carsSource.next([car]);

    expect(store.cars()).toEqual([car]);
    expect(store.isLoading()).toBe(false);
    expect(store.loadError()).toBeNull();
  });

  it('exposes a friendly error when loading fails', () => {
    const store = TestBed.inject(CarsStore);

    carsSource.error(new Error('Firestore is unavailable'));

    expect(store.cars()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.loadError()).toBe("We couldn't load the cars. Please try again.");
  });

  it('exposes cars matching the current search term', () => {
    const store = TestBed.inject(CarsStore);
    carsSource.next([car, japaneseCar]);

    store.setSearchTerm('toyota');

    expect(store.visibleCars()).toEqual([japaneseCar]);
    expect(store.cars()).toEqual([car, japaneseCar]);
  });

  it('filters visible cars by origin', () => {
    const store = TestBed.inject(CarsStore);
    carsSource.next([car, japaneseCar]);

    store.setOrigin('japan');

    expect(store.visibleCars()).toEqual([japaneseCar]);
  });

  it('sorts visible cars without changing the source collection', () => {
    const store = TestBed.inject(CarsStore);
    carsSource.next([car, japaneseCar]);

    store.setSorting('modelYear', 'descending');

    expect(store.visibleCars()).toEqual([japaneseCar, car]);
    expect(store.cars()).toEqual([car, japaneseCar]);
  });

  it('restores the stored query when created', () => {
    storedQuery = {
      searchTerm: 'toyota',
      origin: 'japan',
      sortBy: 'modelYear',
      sortDirection: 'descending',
    };

    const store = TestBed.inject(CarsStore);

    expect(store.query()).toEqual(storedQuery);
  });

  it('persists query changes', () => {
    const store = TestBed.inject(CarsStore);

    store.setOrigin('europe');

    expect(savedQuery).toEqual({
      searchTerm: '',
      origin: 'europe',
      sortBy: 'name',
      sortDirection: 'ascending',
    });
  });
});
