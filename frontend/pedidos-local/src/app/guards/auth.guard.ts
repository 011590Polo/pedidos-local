import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const canAccess = authService.canAccessRoute(state.url);
  if (!canAccess) {
    // Redirigir según el rol
    const user = authService.getCurrentUser();
    if (user?.rol === 'admin') {
      router.navigate(['/dashboard']);
    } else if (user?.rol === 'cliente') {
      router.navigate(['/menu']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  return true;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.isAdmin()) {
    router.navigate(['/menu']);
    return false;
  }

  return true;
};

export const clienteGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!authService.isCliente()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

