import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SessionService } from '../../data-access/session.service';

@Component({
  selector: 'app-owner-sign-in-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './owner-sign-in-dialog.html',
  styleUrl: './owner-sign-in-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerSignInDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly session = inject(SessionService);

  @ViewChild('dialog', { static: true })
  private readonly dialog!: ElementRef<HTMLDialogElement>;

  private opener: HTMLElement | null = null;

  protected readonly isSubmitting = signal(false);
  protected readonly submissionError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  open(opener: HTMLElement): void {
    this.opener = opener;
    this.reset();
    this.dialog.nativeElement.showModal();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submissionError.set(null);

    try {
      const { email, password } = this.form.getRawValue();
      await this.session.signIn(email, password);
      this.dialog.nativeElement.close();
    } catch {
      this.submissionError.set(
        "We couldn't sign you in. Check your details and try again.",
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected close(): void {
    if (!this.isSubmitting()) {
      this.dialog.nativeElement.close();
    }
  }

  protected preventPendingCancellation(event: Event): void {
    if (this.isSubmitting()) {
      event.preventDefault();
    }
  }

  protected onClosed(): void {
    this.reset();
    this.opener?.focus();
    this.opener = null;
  }

  private reset(): void {
    this.form.reset({ email: '', password: '' });
    this.submissionError.set(null);
  }
}
