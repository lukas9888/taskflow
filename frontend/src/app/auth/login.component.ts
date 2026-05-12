import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './auth.css'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  login = '';
  password = '';
  submitting = false;
  error: string | null = null;

  submit(): void {
    const login = this.login.trim();
    if (!login || !this.password) return;

    this.submitting = true;
    this.error = null;
    this.auth.login(login, this.password).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.submitting = false;
        this.error = 'Invalid login or password.';
      }
    });
  }
}

