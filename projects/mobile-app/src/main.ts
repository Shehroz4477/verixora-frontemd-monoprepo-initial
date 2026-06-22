import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import '@ionic/core';
import { addIcons } from 'ionicons';
import {
  powerOutline,
  notificationsOutline,
  settingsOutline,
  locationOutline,
  timeOutline,
  ellipsisVerticalOutline,
  addCircleOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  chevronForwardOutline,
  lockClosedOutline,
  lockOpenOutline,
  keyOutline,
  homeOutline
} from 'ionicons/icons';

addIcons({
  'power-outline': powerOutline,
  'notifications-outline': notificationsOutline,
  'settings-outline': settingsOutline,
  'location-outline': locationOutline,
  'time-outline': timeOutline,
  'ellipsis-vertical-outline': ellipsisVerticalOutline,
  'add-circle-outline': addCircleOutline,
  'document-text-outline': documentTextOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'alert-circle-outline': alertCircleOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'lock-closed-outline': lockClosedOutline,
  'lock-open-outline': lockOpenOutline,
  'key-outline': keyOutline,
  'home-outline': homeOutline
});

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
