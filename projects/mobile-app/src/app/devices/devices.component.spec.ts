import { of } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { DevicesComponent } from './devices.component';

describe('DevicesComponent', () => {
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;
  let component: DevicesComponent;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'post']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isMockMode']);
    auth.isMockMode.and.returnValue(false);
    component = new DevicesComponent(
      jasmine.createSpyObj('Router', ['navigate']),
      auth,
      api
    );
    component.homes = [{ id: 'home-1', name: 'Main Home', role: 'Owner' }];
    component.selectedHomeId = 'home-1';
    component.controllerName = 'Front Door ESP32';
    component.hardwareId = 'esp32-front-001';
    api.get.and.returnValue(of([]));
  });

  it('registers a controller only for an owner and retains the token in memory for the physical session', async () => {
    api.post.and.returnValue(of({
      deviceId: 'controller-1',
      hardwareId: 'ESP32-FRONT-001',
      mqttTopic: 'verixora/controller-1',
      status: 'Pending',
      provisioningToken: 'one-time-token',
      provisioningExpiresAtUtc: '2026-07-21T12:00:00.000Z'
    }));

    await component.registerController();

    expect(api.post).toHaveBeenCalledWith('/devices', {
      homeId: 'home-1',
      name: 'Front Door ESP32',
      hardwareId: 'esp32-front-001'
    });
    expect(component.provisioningReceipt?.token).toBe('one-time-token');
    expect(component.controllers).toEqual([]);
  });

  it('does not submit a controller registration for a guest home member', async () => {
    component.homes = [{ id: 'home-1', name: 'Main Home', role: 'Guest' }];

    await component.registerController();

    expect(api.post).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('Only the owner');
  });

  it('does not create a door for a pending controller', async () => {
    component.controllers = [{
      id: 'controller-1', homeId: 'home-1', name: 'Front Door ESP32', hardwareId: 'ESP32-FRONT-001',
      mqttTopic: 'verixora/controller-1', status: 'Pending', createdAtUtc: '2026-07-21T11:00:00.000Z'
    }];
    component.selectedControllerId = 'controller-1';
    component.doorName = 'Front Door';

    await component.createDoor();

    expect(api.post).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('not provisioned');
  });
});
