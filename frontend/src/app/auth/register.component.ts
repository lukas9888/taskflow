import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './auth.css'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  submitting = false;
  error: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    const username = this.username.trim();
    const email = this.email.trim();
    if (!username || !email || !this.password) return;

    this.submitting = true;
    this.error = null;
    this.auth.register(username, email, this.password).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.submitting = false;
        this.error =
          err?.status === 409
            ? 'Username or email already exists.'
            : 'Could not register.';
      }
    });
  }
}

