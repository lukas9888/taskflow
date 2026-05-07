import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './auth.css'
})
export class RegisterComponent {
  username = '';
  password = '';
  submitting = false;
  serverError: string | null = null;
  usernameServerError: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
  const username = this.username.trim();

  this.serverError = null;
  this.usernameServerError = null;

  if (!username || !this.password) return;

  this.submitting = true;

  this.auth.register(username, this.password).subscribe({
    next: () => {
      this.submitting = false;
      this.router.navigateByUrl('/login');
    },
    error: (err) => {
      this.submitting = false;

      if (err?.status === 409) {
        this.usernameServerError = 'Username already exists.';
      } else {
        this.serverError = 'Could not register. Please try again.';
      }
    }
    });
  }

  clearUsernameServerError(): void {
    this.usernameServerError = null;
  }
  
}

