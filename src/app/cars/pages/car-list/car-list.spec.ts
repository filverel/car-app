import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SessionService } from '../../../auth/data-access/session.service';
import { CarCsvDownloadService } from '../../data-access/car-csv-download.service';
import type { Car } from '../../models/car.model';
import type {
  CarOriginFilter,
  CarQuery,
  CarSortField,
  SortDirection,
} from '../../models/car-query.model';
import { CarsStore } from '../../state/cars.store';
import { CarCreateDialog } from '../../ui/car-create-dialog/car-create-dialog';
import { CarList } from './car-list';

describe('CarList', () => {
  let fixture: ComponentFixture<CarList>;
  let cars: WritableSignal<readonly Car[]>;
  let visibleCars: WritableSignal<readonly Car[]>;
  let isLoading: WritableSignal<boolean>;
  let loadError: WritableSignal<string | null>;
  let isCreating: WritableSignal<boolean>;
  let createError: WritableSignal<string | null>;
  let query: WritableSignal<CarQuery>;
  let currentUser: WritableSignal<{ readonly email: string } | null | undefined>;
  let isInitializing: WritableSignal<boolean>;
  let isSignedIn: WritableSignal<boolean>;
  let signOut: ReturnType<typeof vi.fn>;
  let receivedSearchTerm: string | null;
  let receivedOrigin: CarOriginFilter | null;
  let downloadedCars: readonly Car[] | null;
  let receivedSorting: {
    sortBy: CarSortField;
    sortDirection: SortDirection;
  } | null;

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
    visibleCars = signal<readonly Car[]>([]);
    isLoading = signal(true);
    loadError = signal<string | null>(null);
    isCreating = signal(false);
    createError = signal<string | null>(null);
    currentUser = signal(null);
    isInitializing = signal(false);
    isSignedIn = signal(false);
    signOut = vi.fn().mockResolvedValue(undefined);

    query = signal<CarQuery>({
      searchTerm: '',
      origin: 'all',
      sortBy: 'name',
      sortDirection: 'ascending',
    });

    receivedSearchTerm = null;
    receivedOrigin = null;
    downloadedCars = null;
    receivedSorting = null;

    await TestBed.configureTestingModule({
      imports: [CarList],
      providers: [
        {
          provide: CarsStore,
          useValue: {
            cars,
            visibleCars,
            isLoading,
            loadError,
            isCreating,
            createError,
            query,
            createCar: vi.fn().mockResolvedValue(true),
            clearCreateError: vi.fn(),
            setSearchTerm: (searchTerm: string) => {
              receivedSearchTerm = searchTerm;
            },
            setOrigin: (origin: CarOriginFilter) => {
              receivedOrigin = origin;
            },
            setSorting: (
              sortBy: CarSortField,
              sortDirection: SortDirection,
            ) => {
              receivedSorting = { sortBy, sortDirection };
              query.update((currentQuery) => ({
                ...currentQuery,
                sortBy,
                sortDirection,
              }));
            },
          },
        },
        {
          provide: SessionService,
          useValue: {
            user: currentUser,
            isInitializing,
            isSignedIn,
            signIn: vi.fn().mockResolvedValue(undefined),
            signOut,
          },
        },
        {
          provide: CarCsvDownloadService,
          useValue: {
            download: (carsToDownload: readonly Car[]) => {
              downloadedCars = carsToDownload;
            },
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

  it('shows a query empty state when stored cars do not match', () => {
    cars.set([car]);
    visibleCars.set([]);
    isLoading.set(false);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector(
      '[data-testid="query-empty-state"]',
    ) as HTMLElement | null;

    expect(emptyState?.textContent).toContain('No matching cars');
  });

  it('shows the result count and loaded car', () => {
    cars.set([car]);
    visibleCars.set([car]);
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

  it('exports every stored car regardless of visible results', () => {
    cars.set([car]);
    visibleCars.set([]);
    isLoading.set(false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="export-csv"]',
    ) as HTMLButtonElement;

    button.click();

    expect(downloadedCars).toEqual([car]);
  });

  it('sends search input to the store', () => {
    isLoading.set(false);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#car-search') as HTMLInputElement;

    input.value = 'toyota';
    input.dispatchEvent(new Event('input'));

    expect(receivedSearchTerm).toBe('toyota');
  });

  it('sends the selected origin to the store', () => {
    isLoading.set(false);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#car-origin') as HTMLSelectElement;

    select.value = 'japan';
    select.dispatchEvent(new Event('change'));

    expect(receivedOrigin).toBe('japan');
  });

  it('sends the selected sort field to the store', () => {
    isLoading.set(false);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '#car-sort-field',
    ) as HTMLSelectElement;

    select.value = 'modelYear';
    select.dispatchEvent(new Event('change'));

    expect(receivedSorting).toEqual({
      sortBy: 'modelYear',
      sortDirection: 'ascending',
    });
  });

  it('sends the selected sort direction to the store', () => {
    isLoading.set(false);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector(
      '#car-sort-direction',
    ) as HTMLSelectElement;

    select.value = 'descending';
    select.dispatchEvent(new Event('change'));

    expect(receivedSorting).toEqual({
      sortBy: 'name',
      sortDirection: 'descending',
    });
  });

  it('renders a sort button for every displayed column', () => {
    cars.set([car]);
    visibleCars.set([car]);
    isLoading.set(false);
    fixture.detectChanges();

    const sortButtons = fixture.nativeElement.querySelectorAll(
      '[data-sort-field]',
    ) as NodeListOf<HTMLButtonElement>;

    expect(Array.from(sortButtons, (button) => button.dataset['sortField'])).toEqual([
      'name',
      'modelYear',
      'origin',
      'mpg',
      'cylinders',
      'horsepower',
    ]);
  });

  it('toggles a column between ascending and descending sorting', () => {
    cars.set([car]);
    visibleCars.set([car]);
    isLoading.set(false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-sort-field="name"]',
    ) as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(receivedSorting).toEqual({
      sortBy: 'name',
      sortDirection: 'descending',
    });
    expect(button.closest('th')?.getAttribute('aria-sort')).toBe('descending');

    button.click();
    fixture.detectChanges();

    expect(receivedSorting).toEqual({
      sortBy: 'name',
      sortDirection: 'ascending',
    });
    expect(button.closest('th')?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('shows the owner sign-in control when signed out', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="owner-sign-in"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="add-car"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sign in to add cars to the database.');
  });

  it('does not show signed-out controls while the session initializes', () => {
    isInitializing.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Checking owner session');
    expect(fixture.nativeElement.querySelector('[data-testid="owner-sign-in"]')).toBeNull();
  });

  it('shows owner actions when signed in', () => {
    currentUser.set({ email: 'john@example.com' });
    isSignedIn.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('john@example.com');
    expect(fixture.nativeElement.querySelector('[data-testid="add-car"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="sign-out"]')).not.toBeNull();
  });

  it('signs the owner out', () => {
    currentUser.set({ email: 'john@example.com' });
    isSignedIn.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '[data-testid="sign-out"]',
    ) as HTMLButtonElement;
    button.click();

    expect(signOut).toHaveBeenCalledOnce();
  });

  it('announces successful car creation', () => {
    currentUser.set({ email: 'john@example.com' });
    isSignedIn.set(true);
    fixture.detectChanges();

    const createDialog = fixture.debugElement.query(By.directive(CarCreateDialog))
      .componentInstance as CarCreateDialog;
    createDialog.created.emit('volvo 244 dl');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('volvo 244 dl was added to the database.');
  });
});
