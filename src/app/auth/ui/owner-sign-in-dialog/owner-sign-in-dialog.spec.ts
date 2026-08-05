import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import type { FormGroup } from '@angular/forms';

import { SessionService } from '../../data-access/session.service';
import { OwnerSignInDialog } from './owner-sign-in-dialog';

describe('OwnerSignInDialog', () => {
  let fixture: ComponentFixture<OwnerSignInDialog>;
  let signIn: ReturnType<typeof vi.fn>;
  let dialog: HTMLDialogElement;
  let form: FormGroup;

  beforeEach(async () => {
    signIn = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [OwnerSignInDialog],
      providers: [
        {
          provide: SessionService,
          useValue: { signIn },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerSignInDialog);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    form = (
      fixture.componentInstance as unknown as { readonly form: FormGroup }
    ).form;
  });

  it('does not submit invalid credentials', async () => {
    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();

    expect(signIn).not.toHaveBeenCalled();
    expect(form.controls['email']?.touched).toBe(true);
    expect(form.controls['password']?.touched).toBe(true);
  });

  it('signs in with valid credentials', async () => {
    form.setValue({ email: 'john@example.com', password: 'correct horse battery staple' });

    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();

    expect(signIn).toHaveBeenCalledWith(
      'john@example.com',
      'correct horse battery staple',
    );
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('shows a generic authentication error', async () => {
    signIn.mockRejectedValue(new Error('auth/invalid-credential'));
    form.setValue({ email: 'john@example.com', password: 'incorrect' });

    await (
      fixture.componentInstance as unknown as { submit(): Promise<void> }
    ).submit();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain("We couldn't sign you in");
  });

  it('clears credentials whenever it opens', () => {
    form.setValue({ email: 'john@example.com', password: 'do-not-retain' });

    fixture.componentInstance.open(document.createElement('button'));

    expect(form.getRawValue()).toEqual({ email: '', password: '' });
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });
});
