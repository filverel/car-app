import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { FormGroup } from '@angular/forms';

import type { CarData } from '../../models/car.model';
import { CarsStore } from '../../state/cars.store';
import { CarCreateDialog } from './car-create-dialog';

describe('CarCreateDialog', () => {
  let fixture: ComponentFixture<CarCreateDialog>;
  let form: FormGroup;
  let dialog: HTMLDialogElement;
  let createCar: ReturnType<typeof vi.fn>;
  let clearCreateError: ReturnType<typeof vi.fn>;
  let isCreating: WritableSignal<boolean>;
  let createError: WritableSignal<string | null>;

  const validFormValue = {
    name: '  Volvo   244 DL ',
    mpg: null,
    cylinders: 4,
    displacement: 121,
    horsepower: null,
    weight: 2945,
    acceleration: 14.5,
    modelYear: 1975,
    origin: 'europe',
  };

  beforeEach(async () => {
    createCar = vi.fn().mockResolvedValue(true);
    clearCreateError = vi.fn();
    isCreating = signal(false);
    createError = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [CarCreateDialog],
      providers: [
        {
          provide: CarsStore,
          useValue: {
            isCreating,
            createError,
            createCar,
            clearCreateError,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarCreateDialog);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    form = (
      fixture.componentInstance as unknown as { readonly form: FormGroup }
    ).form;
  });

  it('marks required fields when an empty form is submitted', async () => {
    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();

    expect(createCar).not.toHaveBeenCalled();
    expect(form.controls['name']?.touched).toBe(true);
    expect(form.controls['cylinders']?.touched).toBe(true);
    expect(form.controls['modelYear']?.touched).toBe(true);
    expect(form.controls['origin']?.touched).toBe(true);
  });

  it('rejects fractional cylinders and model years', () => {
    form.setValue({
      ...validFormValue,
      cylinders: 4.5,
      modelYear: 1975.5,
    });

    expect(form.controls['cylinders']?.hasError('integer')).toBe(true);
    expect(form.controls['modelYear']?.hasError('integer')).toBe(true);
  });

  it('maps a valid form to normalized car data and preserves blank values as null', async () => {
    form.setValue(validFormValue);

    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();

    expect(createCar).toHaveBeenCalledWith({
      name: 'volvo 244 dl',
      mpg: null,
      cylinders: 4,
      displacement: 121,
      horsepower: null,
      weight: 2945,
      acceleration: 14.5,
      modelYear: 1975,
      origin: 'europe',
    } satisfies CarData);
  });

  it('keeps the dialog open and shows creation errors', async () => {
    createCar.mockResolvedValue(false);
    createError.set('This car is already in the database.');
    form.setValue(validFormValue);

    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('already in the database');
    expect(dialog.close).not.toHaveBeenCalled();
  });

  it('emits the created name and closes after success', async () => {
    const createdNames: string[] = [];
    fixture.componentInstance.created.subscribe((name) => createdNames.push(name));
    form.setValue(validFormValue);

    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();

    expect(createdNames).toEqual(['volvo 244 dl']);
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('resets stale data and errors whenever it opens', () => {
    form.setValue(validFormValue);

    fixture.componentInstance.open(document.createElement('button'));

    expect(form.getRawValue()).toEqual({
      name: '',
      mpg: null,
      cylinders: null,
      displacement: null,
      horsepower: null,
      weight: null,
      acceleration: null,
      modelYear: null,
      origin: '',
    });
    expect(clearCreateError).toHaveBeenCalledOnce();
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });
});
