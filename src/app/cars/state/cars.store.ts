import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CarsRepository } from '../data-access/cars.repository';
import type { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root',
})
export class CarsStore {
  private readonly repository = inject(CarsRepository);
  private readonly destroyRef = inject(DestroyRef);

  private readonly carsState = signal<readonly Car[]>([]);
  private readonly isLoadingState = signal(true);
  private readonly loadErrorState = signal<string | null>(null);

  readonly cars = this.carsState.asReadonly();
  readonly isLoading = this.isLoadingState.asReadonly();
  readonly loadError = this.loadErrorState.asReadonly();

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
