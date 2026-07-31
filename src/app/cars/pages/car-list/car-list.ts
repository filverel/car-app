import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import type { CarOrigin } from '../../models/car.model';
import type { CarOriginFilter } from '../../models/car-query.model';
import { CarsStore } from '../../state/cars.store';

@Component({
  selector: 'app-car-list',
  templateUrl: './car-list.html',
  styleUrl: './car-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarList {
  protected readonly store = inject(CarsStore);

  protected readonly resultCount = computed(() => {
    const count = this.store.visibleCars().length;
    return `${count} ${count === 1 ? 'car' : 'cars'}`;
  });

  protected onSearchTermChange(searchTerm: string): void {
    this.store.setSearchTerm(searchTerm);
  }

  protected onOriginChange(origin: string): void {
    if (this.isCarOriginFilter(origin)) {
      this.store.setOrigin(origin);
    }
  }

  protected originLabel(origin: CarOrigin): string {
    switch (origin) {
      case 'usa':
        return 'USA';
      case 'europe':
        return 'Europe';
      case 'japan':
        return 'Japan';
      case 'other':
        return 'Other';
    }
  }

  private isCarOriginFilter(value: string): value is CarOriginFilter {
    return (
      value === 'all' ||
      value === 'usa' ||
      value === 'europe' ||
      value === 'japan' ||
      value === 'other'
    );
  }
}
