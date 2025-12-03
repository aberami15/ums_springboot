import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && !authService.isAdmin()) {
    return true;
  }

  if (authService.isLoggedIn() && authService.isAdmin()) {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
