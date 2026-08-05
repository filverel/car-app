import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { ValidationErrors, ValidatorFn } from '@angular/forms';

import { normalizeCarName } from '../../models/car-identity';
import type { CarData, CarOrigin } from '../../models/car.model';
import { CarsStore } from '../../state/cars.store';

const integerValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: unknown = control.value;

  return value === null || value === '' || (typeof value === 'number' && Number.isInteger(value))
    ? null
    : { integer: true };
};

@Component({
  selector: 'app-car-create-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './car-create-dialog.html',
  styleUrl: './car-create-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarCreateDialog {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly store = inject(CarsStore);

  @ViewChild('dialog', { static: true })
  private readonly dialog!: ElementRef<HTMLDialogElement>;

  private opener: HTMLElement | null = null;

  readonly created = output<string>();

  protected readonly form = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(120),
    ]),
    mpg: this.formBuilder.control<number | null>(null, [Validators.min(0), Validators.max(200)]),
    cylinders: this.formBuilder.control<number | null>(null, [
      Validators.required,
      integerValidator,
      Validators.min(1),
      Validators.max(16),
    ]),
    displacement: this.formBuilder.control<number | null>(null, [
      Validators.min(0),
      Validators.max(2000),
    ]),
    horsepower: this.formBuilder.control<number | null>(null, [
      Validators.min(0),
      Validators.max(5000),
    ]),
    weight: this.formBuilder.control<number | null>(null, [
      Validators.min(0),
      Validators.max(50000),
    ]),
    acceleration: this.formBuilder.control<number | null>(null, [
      Validators.min(0),
      Validators.max(120),
    ]),
    modelYear: this.formBuilder.control<number | null>(null, [
      Validators.required,
      integerValidator,
      Validators.min(1886),
      Validators.max(2100),
    ]),
    origin: this.formBuilder.nonNullable.control<CarOrigin | ''>('', Validators.required),
  });

  open(opener: HTMLElement): void {
    this.opener = opener;
    this.reset();
    this.dialog.nativeElement.showModal();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.store.isCreating()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.cylinders === null || value.modelYear === null || !this.isCarOrigin(value.origin)) {
      this.form.markAllAsTouched();
      return;
    }

    const car: CarData = {
      name: normalizeCarName(value.name),
      mpg: value.mpg,
      cylinders: value.cylinders,
      displacement: value.displacement,
      horsepower: value.horsepower,
      weight: value.weight,
      acceleration: value.acceleration,
      modelYear: value.modelYear,
      origin: value.origin,
    };

    if (await this.store.createCar(car)) {
      this.created.emit(car.name);
      this.dialog.nativeElement.close();
    }
  }

  protected close(): void {
    if (!this.store.isCreating()) {
      this.dialog.nativeElement.close();
    }
  }

  protected preventPendingCancellation(event: Event): void {
    if (this.store.isCreating()) {
      event.preventDefault();
    }
  }

  protected onClosed(): void {
    this.reset();
    this.opener?.focus();
    this.opener = null;
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  private reset(): void {
    this.form.reset({
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
    this.store.clearCreateError();
  }

  private isCarOrigin(value: CarOrigin | ''): value is CarOrigin {
    return value === 'usa' || value === 'europe' || value === 'japan' || value === 'other';
  }
}
