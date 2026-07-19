import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

interface Door {
  id: string;
  name: string;
  home: string;
  controllerStatus: string;
  lockStatus: string;
  requiresFace: boolean;
  lastActivity: string;
}

interface HomeDto {
  id: string;
  name: string;
}

interface SmartLockDto {
  id: string;
  name: string;
  controllerStatus: string;
  status: string;
  requiresFace: boolean;
  lastUnlockedAtUtc?: string | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  doors: Door[] = [];
  greeting = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hour = new Date().getHours();
    this.greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    this.loadDoors();
  }

  loadDoors(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.auth.isMockMode()) {
      this.doors = [
        { id: '1', name: 'Front Door', home: 'Main Home', controllerStatus: 'Online', lockStatus: 'Locked', requiresFace: true, lastActivity: '2 hours ago' },
        { id: '2', name: 'Back Door', home: 'Main Home', controllerStatus: 'Online', lockStatus: 'Locked', requiresFace: false, lastActivity: '5 hours ago' },
        { id: '3', name: 'Office Door', home: 'Work', controllerStatus: 'Offline', lockStatus: 'Locked', requiresFace: false, lastActivity: '1 day ago' }
      ];
      this.isLoading = false;
      return;
    }

    this.api.get<HomeDto[]>('/homes').pipe(
      switchMap(homes => {
        if (homes.length === 0) {
          return of([] as Door[]);
        }

        return forkJoin(homes.map(home =>
          this.api.get<SmartLockDto[]>(`/locks?homeId=${encodeURIComponent(home.id)}`).pipe(
            map(locks => locks.map(lockItem => this.toDoor(lockItem, home)))
          )
        )).pipe(map(groups => groups.flat()));
      })
    ).subscribe({
      next: (data) => {
        this.doors = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load doors:', err);
        this.errorMessage = err.error?.error || 'Failed to load doors. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get onlineCount(): number {
    return this.doors.filter(door => door.controllerStatus === 'Online').length;
  }

  get offlineCount(): number {
    return this.doors.filter(door => door.controllerStatus !== 'Online').length;
  }

  unlockDoor(doorId: string): void {
    const door = this.doors.find(item => item.id === doorId);
    if (!door || !this.canUnlock(door)) return;

    const idempotencyKey = crypto.randomUUID();
    if (this.auth.isMockMode()) {
      alert(`Unlock request queued for "${door.name}" (mock mode).`);
      return;
    }

    const formData = new FormData();
    formData.append('idempotencyKey', idempotencyKey);
    this.api.postMultipart<{ message: string }>(`/locks/${doorId}/unlock`, formData).subscribe({
      next: (result) => {
        alert(`Unlock request queued for "${door.name}". ${result.message || 'Controller acknowledgement is pending.'}`);
        this.loadDoors();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to queue the unlock request.');
      }
    });
  }

  canUnlock(door: Door): boolean {
    return door.controllerStatus === 'Online' && door.lockStatus !== 'EmergencyLocked';
  }

  logout(): void {
    this.auth.logout();
  }

  openSettings(): void {
    this.router.navigate(['/tabs/profile']);
  }

  openNotifications(): void {
    this.router.navigate(['/tabs/notifications']);
  }

  viewAllDoors(): void {
    this.router.navigate(['/tabs/devices']);
  }

  addDoor(): void {
    alert('Controller registration is available from the Devices tab.');
  }

  viewAuditLog(): void {
    alert('Audit history will be available in the web portal and Devices tab.');
  }

  showDoorOptions(door: Door): void {
    alert(`${door.name}\nController: ${door.controllerStatus}\nLock: ${door.lockStatus}\nFace verification: ${door.requiresFace ? 'required' : 'not required'}`);
  }

  private toDoor(lockItem: SmartLockDto, home: HomeDto): Door {
    return {
      id: lockItem.id,
      name: lockItem.name,
      home: home.name,
      controllerStatus: lockItem.controllerStatus,
      lockStatus: lockItem.status,
      requiresFace: lockItem.requiresFace,
      lastActivity: lockItem.lastUnlockedAtUtc ? new Date(lockItem.lastUnlockedAtUtc).toLocaleString() : 'Never unlocked'
    };
  }
}
