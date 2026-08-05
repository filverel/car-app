import { readFileSync } from 'node:fs';

import 'firebase/compat/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'demo-car-app-rules';
const ownerUid = 'rules-test-owner';
const nonOwnerUid = 'rules-test-non-owner';
const validCarId = 'car-501523512cba2441db9d';
const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

function validCarDocument() {
  return {
    name: 'chevrolet chevelle malibu',
    mpg: 18,
    cylinders: 8,
    displacement: 307,
    horsepower: 130,
    weight: 3504,
    acceleration: 12,
    modelYear: 1970,
    origin: 'usa',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

describe('Firestore security rules', () => {
  let testEnvironment: RulesTestEnvironment;

  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId,
      firestore: { rules },
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'admins', ownerUid), { role: 'owner' });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it('allows anyone to read cars', async () => {
    await seedCar(validCarId);
    const database = testEnvironment.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(database, 'cars', validCarId)));
  });

  it('denies anonymous car creation', async () => {
    const database = testEnvironment.unauthenticatedContext().firestore();

    await assertFails(setDoc(doc(database, 'cars', validCarId), validCarDocument()));
  });

  it('denies car creation by an authenticated non-owner', async () => {
    const database = testEnvironment.authenticatedContext(nonOwnerUid).firestore();

    await assertFails(setDoc(doc(database, 'cars', validCarId), validCarDocument()));
  });

  it('allows an owner to create a valid car', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertSucceeds(setDoc(doc(database, 'cars', validCarId), validCarDocument()));
  });

  it('denies a car with an invalid document ID', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(setDoc(doc(database, 'cars', 'automatic-id'), validCarDocument()));
  });

  it('denies a car with missing fields', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();
    const { name: _name, ...missingName } = validCarDocument();

    await assertFails(setDoc(doc(database, 'cars', validCarId), missingName));
  });

  it('denies a car with unexpected fields', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(
      setDoc(doc(database, 'cars', validCarId), {
        ...validCarDocument(),
        isFeatured: true,
      }),
    );
  });

  it.each([
    ['a malformed numeric value', { mpg: 'fast' }],
    ['cylinders outside the allowed range', { cylinders: 17 }],
    ['a fractional cylinder count', { cylinders: 4.5 }],
    ['a model year outside the allowed range', { modelYear: 2101 }],
    ['a fractional model year', { modelYear: 1970.5 }],
    ['an unsupported origin', { origin: 'moon' }],
  ])('denies %s', async (_description, invalidFields) => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(
      setDoc(doc(database, 'cars', validCarId), {
        ...validCarDocument(),
        ...invalidFields,
      }),
    );
  });

  it('denies client-generated timestamps', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();
    const clientTimestamp = Timestamp.fromDate(new Date('2026-08-05T10:00:00.000Z'));

    await assertFails(
      setDoc(doc(database, 'cars', validCarId), {
        ...validCarDocument(),
        createdAt: clientTimestamp,
        updatedAt: clientTimestamp,
      }),
    );
  });

  it('denies car updates by an owner', async () => {
    await seedCar(validCarId);
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(updateDoc(doc(database, 'cars', validCarId), { mpg: 19 }));
  });

  it('denies car deletion by an owner', async () => {
    await seedCar(validCarId);
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(deleteDoc(doc(database, 'cars', validCarId)));
  });

  it('denies replacing an existing duplicate car', async () => {
    await seedCar(validCarId);
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(setDoc(doc(database, 'cars', validCarId), validCarDocument()));
  });

  it('denies clients from reading admin documents', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(getDoc(doc(database, 'admins', ownerUid)));
  });

  it('denies clients from writing admin documents', async () => {
    const database = testEnvironment.authenticatedContext(ownerUid).firestore();

    await assertFails(
      setDoc(doc(database, 'admins', 'another-owner'), { role: 'owner' }),
    );
  });

  async function seedCar(documentId: string): Promise<void> {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'cars', documentId), {
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
      });
    });
  }
});
