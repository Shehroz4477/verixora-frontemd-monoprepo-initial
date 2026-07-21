import { Observable, of } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  it('loads and sorts audit activity only for homes owned by the user', () => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['get']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['isMockMode']);
    auth.isMockMode.and.returnValue(false);
    api.get.and.callFake(<T>(endpoint: string): Observable<T> => {
      if (endpoint === '/homes') {
        return of([
          { id: 'home-owned', name: 'Main Home', role: 'Owner' },
          { id: 'home-guest', name: 'Holiday Home', role: 'Guest' }
        ]) as Observable<T>;
      }

      return of([
        { id: 'older', action: 'UnlockRequest', timestamp: '2026-07-21T10:00:00.000Z', result: true },
        { id: 'newer', action: 'ControllerAcknowledgement', timestamp: '2026-07-21T10:01:00.000Z', result: true }
      ]) as Observable<T>;
    });
    const component = new NotificationsComponent(jasmine.createSpyObj('Router', ['navigate']), auth, api);

    component.loadActivity();

    expect(api.get).toHaveBeenCalledWith('/auditlogs?homeId=home-owned');
    expect(api.get).not.toHaveBeenCalledWith('/auditlogs?homeId=home-guest');
    expect(component.activity.map(item => item.id)).toEqual(['newer', 'older']);
    expect(component.activity[0].homeName).toBe('Main Home');
    expect(component.isLoading).toBeFalse();
  });
});
