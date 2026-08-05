import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionSnapshots,
  doc,
  Firestore,
  runTransaction,
  serverTimestamp,
} from '@angular/fire/firestore';
import type { CollectionReference, WithFieldValue } from '@angular/fire/firestore';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { createCarDocumentId } from '../models/car-identity';
import type { Car, CarData } from '../models/car.model';
import type { CarDocument } from './car-document.model';
import { mapCarDocument } from './car-document.mapper';
import { DuplicateCarError } from './duplicate-car.error';

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

  async create(car: CarData): Promise<void> {
    const documentId = await createCarDocumentId(car);
    const carReference = doc(this.carsCollection, documentId);
    const carDocument: WithFieldValue<CarDocument> = {
      ...car,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await runTransaction(this.firestore, async (transaction) => {
      const existingCar = await transaction.get(carReference);

      if (existingCar.exists()) {
        throw new DuplicateCarError();
      }

      transaction.set(carReference, carDocument);
    });
  }
}
