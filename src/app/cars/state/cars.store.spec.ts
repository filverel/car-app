import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { CarsRepository } from '../data-access/cars.repository';
import type { Car } from '../models/car.model';
import { CarsStore } from './cars.store';

describe('CarsStore', () => {
  let carsSource: Subject<readonly Car[]>;

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

  beforeEach(() => {
    carsSource = new Subject<readonly Car[]>();

    TestBed.configureTestingModule({
      providers: [
        CarsStore,
        {
          provide: CarsRepository,
          useValue: {
            watchAll: () => carsSource.asObservable(),
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
});
