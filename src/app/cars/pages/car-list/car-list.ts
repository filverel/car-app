import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { SessionService } from '../../../auth/data-access/session.service';
import { OwnerSignInDialog } from '../../../auth/ui/owner-sign-in-dialog/owner-sign-in-dialog';
import { CarCsvDownloadService } from '../../data-access/car-csv-download.service';
import type { CarOrigin } from '../../models/car.model';
import type {
  CarOriginFilter,
  CarSortField,
  SortDirection,
} from '../../models/car-query.model';
import { CarsStore } from '../../state/cars.store';
import { CarCreateDialog } from '../../ui/car-create-dialog/car-create-dialog';

@Component({
  selector: 'app-car-list',
  imports: [OwnerSignInDialog, CarCreateDialog],
  templateUrl: './car-list.html',
  styleUrl: './car-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarList {
  protected readonly store = inject(CarsStore);
  protected readonly session = inject(SessionService);
  private readonly csvDownload = inject(CarCsvDownloadService);

  protected readonly isSigningOut = signal(false);
  protected readonly sessionError = signal<string | null>(null);
  protected readonly creationSuccess = signal<string | null>(null);

  protected readonly resultCount = computed(() => {
    const count = this.store.visibleCars().length;
    return `${count} ${count === 1 ? 'car' : 'cars'}`;
  });

  protected onSearchTermChange(searchTerm: string): void {
    this.store.setSearchTerm(searchTerm);
  }

  protected exportCsv(): void {
    this.csvDownload.download(this.store.cars());
  }

  protected async signOut(): Promise<void> {
    if (this.isSigningOut()) {
      return;
    }

    this.isSigningOut.set(true);
    this.sessionError.set(null);
    this.creationSuccess.set(null);

    try {
      await this.session.signOut();
    } catch {
      this.sessionError.set("We couldn't sign you out. Please try again.");
    } finally {
      this.isSigningOut.set(false);
    }
  }

  protected onCarCreated(name: string): void {
    this.creationSuccess.set(`${name} was added to the database.`);
  }

  protected onOriginChange(origin: string): void {
    if (this.isCarOriginFilter(origin)) {
      this.store.setOrigin(origin);
    }
  }

  protected onSortFieldChange(sortBy: string): void {
    if (this.isCarSortField(sortBy)) {
      this.store.setSorting(
        sortBy,
        this.store.query().sortDirection,
      );
    }
  }

  protected onSortDirectionChange(sortDirection: string): void {
    if (this.isSortDirection(sortDirection)) {
      this.store.setSorting(
        this.store.query().sortBy,
        sortDirection,
      );
    }
  }

  protected onColumnSort(sortBy: CarSortField): void {
    const query = this.store.query();
    const sortDirection: SortDirection =
      query.sortBy === sortBy && query.sortDirection === 'ascending'
        ? 'descending'
        : 'ascending';

    this.store.setSorting(sortBy, sortDirection);
  }

  protected columnAriaSort(sortBy: CarSortField): SortDirection | null {
    const query = this.store.query();
    return query.sortBy === sortBy ? query.sortDirection : null;
  }

  protected sortIndicator(sortBy: CarSortField): string {
    const query = this.store.query();

    if (query.sortBy !== sortBy) {
      return '↕';
    }

    return query.sortDirection === 'ascending' ? '↑' : '↓';
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

  private isCarSortField(value: string): value is CarSortField {
    return (
      value === 'name' ||
      value === 'modelYear' ||
      value === 'origin' ||
      value === 'mpg' ||
      value === 'cylinders' ||
      value === 'horsepower'
    );
  }

  private isSortDirection(value: string): value is SortDirection {
    return value === 'ascending' || value === 'descending';
  }
}
