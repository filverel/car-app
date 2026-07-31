import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { serializeCarsToCsv } from '../models/car-csv.serializer';
import type { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root',
})
export class CarCsvDownloadService {
  private readonly document = inject(DOCUMENT);

  download(cars: readonly Car[]): void {
    const csv = serializeCarsToCsv(cars);

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8',
    });

    const objectUrl = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = this.createFilename();
    anchor.hidden = true;

    this.document.body.appendChild(anchor);

    try {
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    }
  }

  private createFilename(): string {
    const date = new Date().toISOString().slice(0, 10);
    return `cars-backup-${date}.csv`;
  }
}
