import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CAR_QUERY_STORAGE,
  CAR_QUERY_STORAGE_KEY,
  CarQueryStorage,
} from './car-query.storage';

describe('CarQueryStorage', () => {
  const storage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    TestBed.configureTestingModule({
      providers: [
        CarQueryStorage,
        {
          provide: CAR_QUERY_STORAGE,
          useValue: storage,
        },
      ],
    });
  });

  it('returns the default query when nothing is stored', () => {
    storage.getItem.mockReturnValue(null);

    const queryStorage = TestBed.inject(CarQueryStorage);

    expect(queryStorage.load()).toEqual({
      searchTerm: '',
      origin: 'all',
      sortBy: 'name',
      sortDirection: 'ascending',
    });
  });

  it('loads a valid stored query', () => {
    storage.getItem.mockReturnValue(
      JSON.stringify({
        searchTerm: 'toyota',
        origin: 'japan',
        sortBy: 'modelYear',
        sortDirection: 'descending',
      }),
    );

    const queryStorage = TestBed.inject(CarQueryStorage);

    expect(queryStorage.load()).toEqual({
      searchTerm: 'toyota',
      origin: 'japan',
      sortBy: 'modelYear',
      sortDirection: 'descending',
    });
  });

  it('returns the default query for malformed JSON', () => {
    storage.getItem.mockReturnValue('{not valid JSON');

    const queryStorage = TestBed.inject(CarQueryStorage);

    expect(queryStorage.load()).toEqual({
      searchTerm: '',
      origin: 'all',
      sortBy: 'name',
      sortDirection: 'ascending',
    });
  });

  it('returns the default query for unsupported values', () => {
    storage.getItem.mockReturnValue(
      JSON.stringify({
        searchTerm: '',
        origin: 'moon',
        sortBy: 'price',
        sortDirection: 'sideways',
      }),
    );

    const queryStorage = TestBed.inject(CarQueryStorage);

    expect(queryStorage.load()).toEqual({
      searchTerm: '',
      origin: 'all',
      sortBy: 'name',
      sortDirection: 'ascending',
    });
  });

  it('saves a query as JSON', () => {
    const queryStorage = TestBed.inject(CarQueryStorage);

    const query = {
      searchTerm: 'ford',
      origin: 'usa',
      sortBy: 'horsepower',
      sortDirection: 'descending',
    } as const;

    queryStorage.save(query);

    expect(storage.setItem).toHaveBeenCalledWith(
      CAR_QUERY_STORAGE_KEY,
      JSON.stringify(query),
    );
  });
});
