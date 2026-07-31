import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';

import type { Car } from '../../models/car.model';
import { CarsStore } from '../../state/cars.store';
import { CarList } from './car-list';

describe('CarList', () => {
  let fixture: ComponentFixture<CarList>;
  let cars: WritableSignal<readonly Car[]>;
  let isLoading: WritableSignal<boolean>;
  let loadError: WritableSignal<string | null>;

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

  beforeEach(async () => {
    cars = signal<readonly Car[]>([]);
    isLoading = signal(true);
    loadError = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [CarList],
      providers: [
        {
          provide: CarsStore,
          useValue: {
            cars,
            isLoading,
            loadError,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarList);
  });

  it('shows a loading status', () => {
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;

    expect(status?.textContent).toContain('Loading cars');
  });

  it('shows a load error', () => {
    isLoading.set(false);
    loadError.set("We couldn't load the cars. Please try again.");
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;

    expect(alert?.textContent).toContain("We couldn't load the cars. Please try again.");
  });

  it('shows an empty state when no cars exist', () => {
    isLoading.set(false);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector(
      '[data-testid="empty-state"]',
    ) as HTMLElement | null;

    expect(emptyState?.textContent).toContain('No cars found');
  });

  it('shows the result count and loaded car', () => {
    cars.set([car]);
    isLoading.set(false);
    fixture.detectChanges();

    const resultCount = fixture.nativeElement.querySelector(
      '[data-testid="result-count"]',
    ) as HTMLElement | null;

    const table = fixture.nativeElement.querySelector('table') as HTMLTableElement | null;

    expect(resultCount?.textContent).toContain('1 car');
    expect(table?.textContent).toContain('chevrolet chevelle malibu');
    expect(table?.textContent).toContain('1970');
  });
});
