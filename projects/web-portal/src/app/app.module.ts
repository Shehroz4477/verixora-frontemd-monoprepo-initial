import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WebLoginComponent } from './login/web-login.component';
import { WebDashboardComponent } from './dashboard/web-dashboard.component';
import { WebAuthInterceptor } from './core/web-auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    WebLoginComponent,
    WebDashboardComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: WebAuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
