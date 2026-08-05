export class DuplicateCarError extends Error {
  constructor() {
    super('A car with the same normalized data already exists.');
    this.name = 'DuplicateCarError';
  }
}
