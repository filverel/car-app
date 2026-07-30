import { inject, Injectable } from '@angular/core';
import { collection, collectionSnapshots, Firestore } from '@angular/fire/firestore';
import type { CollectionReference } from '@angular/fire/firestore';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import type { Car } from '../models/car.model';
import type { CarDocument } from './car-document.model';
import { mapCarDocument } from './car-document.mapper';

@Injectable({
  providedIn: 'root',
})
export class CarsRepository {
  private readonly firestore = inject(Firestore);

  private readonly carsCollection = collection(
    this.firestore,
    'cars',
  ) as CollectionReference<CarDocument>;

  watchAll(): Observable<readonly Car[]> {
    return collectionSnapshots(this.carsCollection).pipe(
      map((snapshots) => snapshots.map((snapshot) => mapCarDocument(snapshot.id, snapshot.data()))),
    );
  }
}
