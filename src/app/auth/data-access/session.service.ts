import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly auth = inject(Auth);

  /** Undefined while Firebase restores the session; null after an anonymous result. */
  readonly user = toSignal(authState(this.auth));

  readonly isInitializing = computed(() => this.user() === undefined);
  readonly isSignedIn = computed(() => this.user() !== undefined && this.user() !== null);

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }
}
