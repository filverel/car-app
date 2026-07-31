import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CarsRepository } from '../data-access/cars.repository';
import type { Car } from '../models/car.model';
import { applyCarQuery } from '../models/car-query';
import type {
  CarOriginFilter,
  CarQuery,
  CarSortField,
  SortDirection,
} from '../models/car-query.model';
import { CarQueryStorage } from './car-query.storage';

@Injectable({
  providedIn: 'root',
})
export class CarsStore {
  private readonly repository = inject(CarsRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryStorage = inject(CarQueryStorage);

  private readonly carsState = signal<readonly Car[]>([]);
  private readonly isLoadingState = signal(true);
  private readonly loadErrorState = signal<string | null>(null);

  private readonly queryState = signal<CarQuery>(
    this.queryStorage.load(),
  );

  readonly cars = this.carsState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();
  readonly loadError = this.loadErrorState.asReadonly();
  readonly query = this.queryState.asReadonly();

  readonly visibleCars = computed(() => applyCarQuery(this.carsState(), this.queryState()));

  setSearchTerm(searchTerm: string): void {
    this.updateQuery({ searchTerm });
  }

  setOrigin(origin: CarOriginFilter): void {
    this.updateQuery({ origin });
  }

  setSorting(sortBy: CarSortField, sortDirection: SortDirection): void {
    this.updateQuery({ sortBy, sortDirection });
  }

  private updateQuery(changes: Partial<CarQuery>): void {
    const nextQuery: CarQuery = {
      ...this.queryState(),
      ...changes,
    };

    this.queryState.set(nextQuery);
    this.queryStorage.save(nextQuery);
  }

  constructor() {
    this.repository
      .watchAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cars) => {
          this.carsState.set(cars);
          this.isLoadingState.set(false);
          this.loadErrorState.set(null);
        },
        error: () => {
          this.carsState.set([]);
          this.isLoadingState.set(false);
          this.loadErrorState.set("We couldn't load the cars. Please try again.");
        },
      });
  }
}
