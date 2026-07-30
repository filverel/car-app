export type CarOrigin = 'usa' | 'europe' | 'japan' | 'other';

export interface CarData {
  readonly name: string;

  /** Fuel economy measured in miles per gallon. */
  readonly mpg: number | null;

  readonly cylinders: number;

  /** Engine displacement measured in cubic inches. */
  readonly displacement: number | null;

  readonly horsepower: number | null;

  /** Vehicle weight measured in pounds. */
  readonly weight: number | null;

  /** Acceleration time measured in seconds. */
  readonly acceleration: number | null;

  /** Full four-digit year, for example 1970. */
  readonly modelYear: number;

  readonly origin: CarOrigin;
}

export interface Car extends CarData {
  readonly id: string;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
}
