import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { CarsRepository } from '../data-access/cars.repository';
import { DuplicateCarError } from '../data-access/duplicate-car.error';
import type { Car, CarData } from '../models/car.model';
import type { CarQuery } from '../models/car-query.model';
import { CarQueryStorage } from './car-query.storage';
import { CarsStore } from './cars.store';

describe('CarsStore', () => {
  let carsSource: Subject<readonly Car[]>;
  let storedQuery: CarQuery;
  let savedQuery: CarQuery | null;
  let createCar: ReturnType<typeof vi.fn>;

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

  const newCar: CarData = {
    name: 'volvo 244 dl',
    mpg: 22,
    cylinders: 4,
    displacement: 121,
    horsepower: 98,
    weight: 2945,
    acceleration: 14.5,
    modelYear: 1975,
    origin: 'europe',
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
    createCar = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        CarsStore,
        {
          provide: CarsRepository,
          useValue: {
            watchAll: () => carsSource.asObservable(),
            create: createCar,
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

  it('starts with an idle car creation state', () => {
    const store = TestBed.inject(CarsStore);

    expect(store.isCreating()).toBe(false);
    expect(store.createError()).toBeNull();
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

  it('creates a car through the repository', async () => {
    const store = TestBed.inject(CarsStore);

    await expect(store.createCar(newCar)).resolves.toBe(true);

    expect(createCar).toHaveBeenCalledOnce();
    expect(createCar).toHaveBeenCalledWith(newCar);
    expect(store.isCreating()).toBe(false);
    expect(store.createError()).toBeNull();
  });

  it('exposes a pending state while a car is being created', async () => {
    let resolveCreate!: () => void;
    createCar.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const store = TestBed.inject(CarsStore);

    const creationResult = store.createCar(newCar);

    expect(store.isCreating()).toBe(true);

    resolveCreate();

    await expect(creationResult).resolves.toBe(true);
    expect(store.isCreating()).toBe(false);
  });

  it('exposes a friendly duplicate error', async () => {
    createCar.mockRejectedValue(new DuplicateCarError());
    const store = TestBed.inject(CarsStore);

    await expect(store.createCar(newCar)).resolves.toBe(false);

    expect(store.createError()).toBe('This car is already in the database.');
    expect(store.isCreating()).toBe(false);
  });

  it('exposes a friendly error when car creation fails', async () => {
    createCar.mockRejectedValue(new Error('Firestore is unavailable'));
    const store = TestBed.inject(CarsStore);

    await expect(store.createCar(newCar)).resolves.toBe(false);

    expect(store.createError()).toBe(
      "We couldn't add the car. Please check your connection and try again.",
    );
    expect(store.isCreating()).toBe(false);
  });

  it('clears the car creation error', async () => {
    createCar.mockRejectedValue(new DuplicateCarError());
    const store = TestBed.inject(CarsStore);
    await store.createCar(newCar);

    store.clearCreateError();

    expect(store.createError()).toBeNull();
  });

  it('prevents concurrent car creation attempts', async () => {
    let resolveCreate!: () => void;
    createCar.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    const store = TestBed.inject(CarsStore);

    const firstResult = store.createCar(newCar);
    const secondResult = store.createCar(newCar);

    await expect(secondResult).resolves.toBe(false);
    expect(createCar).toHaveBeenCalledOnce();

    resolveCreate();
    await expect(firstResult).resolves.toBe(true);
  });
});
