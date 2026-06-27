import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OtpComponent } from './otp/otp.component';
import { OtpPageComponent } from './otp-page/otp-page.component';
import { RegistrationComponent } from './registration/registration.component';
import { CountrySelectorModalComponent } from './country-selector-modal/country-selector-modal.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { TabsComponent } from './tabs/tabs.component';
import { DevicesComponent } from './devices/devices.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { ProfileComponent } from './profile/profile.component';
import { FaceEnrollmentModalComponent } from './face-enrollment-modal/face-enrollment-modal.component';
import { FaceEnrollmentComponent } from './face-enrollment/face-enrollment.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    OtpComponent,
    OtpPageComponent,
    RegistrationComponent,
    CountrySelectorModalComponent,
    TabsComponent,
    DevicesComponent,
    NotificationsComponent,
    ProfileComponent,
    FaceEnrollmentModalComponent,
    FaceEnrollmentComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }