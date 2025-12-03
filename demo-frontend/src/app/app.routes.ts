import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { UserDashboard } from './components/user-dashboard/user-dashboard';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { userGuard } from './guards/user-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'admin',
    component: AdminDashboard,
    canActivate: [adminGuard]
  },
  {
    path: 'user',
    component: UserDashboard,
    canActivate: [userGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
