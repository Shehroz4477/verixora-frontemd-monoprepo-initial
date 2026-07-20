import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceService);
  });

  it('refuses browser device binding', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('web');

    await expectAsync(service.getDeviceBinding())
      .toBeRejectedWithError('Use the Android emulator or device to test cryptographic device binding.');
  });

  it('refuses browser nearby-door signatures', async () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('web');

    await expectAsync(service.signPresencePayload('Verixora.BlePresence.v1|test'))
      .toBeRejectedWithError('Nearby-door proof requires the Android application.');
  });
});
