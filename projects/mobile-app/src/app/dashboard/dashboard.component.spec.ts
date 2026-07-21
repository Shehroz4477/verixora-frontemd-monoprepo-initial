import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { NearbyPresenceService } from '../core/services/nearby-presence.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  it('routes the dashboard audit action to the mobile security activity screen', () => {
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const component = new DashboardComponent(
      jasmine.createSpyObj<AuthService>('AuthService', ['isMockMode', 'logout']),
      jasmine.createSpyObj<ApiService>('ApiService', ['get', 'postMultipart']),
      router,
      jasmine.createSpyObj<NearbyPresenceService>('NearbyPresenceService', ['proveNearbyPresence'])
    );

    component.viewAuditLog();

    expect(router.navigate).toHaveBeenCalledWith(['/tabs/notifications']);
  });
});
