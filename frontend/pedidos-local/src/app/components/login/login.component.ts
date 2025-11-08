import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  usuario: string = 'admin';
  password: string = 'admin123';
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir según rol
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
    // Campos prellenados para administrador
  }

  onSubmit(): void {
    if (!this.usuario.trim() || !this.password.trim()) {
      this.error = 'Usuario y contraseña son requeridos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.usuario.trim(), this.password).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        if (response.success) {
          this.redirectByRole();
        } else {
          this.error = response.message || 'Error al iniciar sesión';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        console.error('❌ Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.error?.message || err.message
        });
        this.error = err.error?.message || err.error?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
        this.loading = false;
      }
    });
  }

  private redirectByRole(): void {
    const user = this.authService.getCurrentUser();
    if (user?.rol === 'admin') {
      this.router.navigate(['/dashboard']);
    } else if (user?.rol === 'cliente') {
      this.router.navigate(['/menu']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

