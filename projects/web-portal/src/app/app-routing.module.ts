import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebLoginComponent } from './login/web-login.component';
import { WebDashboardComponent } from './dashboard/web-dashboard.component';
import { WebAuthGuard } from './core/web-auth.guard';

const routes: Routes = [
  { path: 'login', component: WebLoginComponent },
  { path: 'dashboard', component: WebDashboardComponent, canActivate: [WebAuthGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
