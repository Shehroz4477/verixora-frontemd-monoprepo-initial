import { provideZoneChangeDetection } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import '@ionic/core';
import { addIcons } from 'ionicons';
import {
  // Bottom Navigation
  cameraOutline,
  gridOutline,
  addOutline,
  personOutline,
  // Face Enrollment
  scanOutline,
  checkmarkOutline,
  // Auth / Login
  callOutline,
  lockClosedOutline,
  lockOpenOutline,
  sendOutline,
  logInOutline,
  informationCircleOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  // Dashboard
  homeOutline,
  notificationsOutline,
  settingsOutline,
  powerOutline,
  locationOutline,
  timeOutline,
  ellipsisVerticalOutline,
  addCircleOutline,
  documentTextOutline,
  chevronForwardOutline,
  keyOutline,
  // Registration
  mailOutline,
  radioButtonOffOutline,
  chevronDownOutline,
  closeOutline,
  arrowBackOutline,
} from 'ionicons/icons';

addIcons({
  // Bottom Navigation
  'camera-outline': cameraOutline,
  'grid-outline': gridOutline,
  'add-outline': addOutline,
  'person-outline': personOutline,
  // Face Enrollment
  'scan-outline': scanOutline,
  'checkmark-outline': checkmarkOutline,
  // Auth / Login
  'call-outline': callOutline,
  'lock-closed-outline': lockClosedOutline,
  'lock-open-outline': lockOpenOutline,
  'send-outline': sendOutline,
  'log-in-outline': logInOutline,
  'information-circle-outline': informationCircleOutline,
  'alert-circle-outline': alertCircleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  // Dashboard
  'home-outline': homeOutline,
  'notifications-outline': notificationsOutline,
  'settings-outline': settingsOutline,
  'power-outline': powerOutline,
  'location-outline': locationOutline,
  'time-outline': timeOutline,
  'ellipsis-vertical-outline': ellipsisVerticalOutline,
  'add-circle-outline': addCircleOutline,
  'document-text-outline': documentTextOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'key-outline': keyOutline,
  // Registration
  'mail-outline': mailOutline,
  'radio-button-off-outline': radioButtonOffOutline,
  'chevron-down-outline': chevronDownOutline,
  'close-outline': closeOutline,
  'arrow-back-outline': arrowBackOutline,
});

platformBrowserDynamic()
  .bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.error(err));