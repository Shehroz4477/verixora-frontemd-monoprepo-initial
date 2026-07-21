import { of } from 'rxjs';
import { WebApiService } from '../core/web-api.service';
import { WebAuthService } from '../core/web-auth.service';
import { MonitoringHubService } from '../core/monitoring-hub.service';
import { WebDashboardComponent } from './web-dashboard.component';

describe('WebDashboardComponent', () => {
  it('loads authorised controllers together with locks and the audit trail for the selected home', () => {
    const api = jasmine.createSpyObj<WebApiService>('WebApiService', ['get']);
    const auth = jasmine.createSpyObj<WebAuthService>('WebAuthService', ['token']);
    const hub = jasmine.createSpyObj<MonitoringHubService>('MonitoringHubService', ['connect', 'disconnect'], { auditEvents$: of() });
    const component = new WebDashboardComponent(api, auth, hub);
    component.selectedHomeId = 'home-1';
    api.get.and.returnValues(
      of([{ id: 'controller-1', name: 'Front Door ESP32', hardwareId: 'ESP32-FRONT-001', mqttTopic: 'verixora/controller-1', status: 'Pending', createdAtUtc: '2026-07-21T10:00:00.000Z' }]),
      of([{ id: 'lock-1', name: 'Front Door', status: 'Locked', controllerStatus: 'Pending', requiresFace: true }]),
      of([{ id: 'audit-1', action: 'ControllerRegistered', timestampUtc: '2026-07-21T10:00:01.000Z', result: true }])
    );

    component.loadSelectedHome();

    expect(api.get).toHaveBeenCalledWith('/devices?homeId=home-1');
    expect(component.controllers[0].status).toBe('Pending');
    expect(component.locks[0].name).toBe('Front Door');
    expect(component.auditLogs[0].action).toBe('ControllerRegistered');
  });
});
