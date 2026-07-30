import type { Timestamp } from '@angular/fire/firestore';

import type { CarData } from '../models/car.model';

export interface CarDocument extends CarData {
  readonly createdAt: Timestamp | null;
  readonly updatedAt: Timestamp | null;
}
