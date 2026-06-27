import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

interface Door {
  id: string;
  name: string;
  home: string;
  status: 'online' | 'offline' | 'locked';
  deviceId?: string;
  mqttTopic?: string;
  lastActivity: string;  // static – no random generation in template
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  doors: Door[] = [];
  greeting: string = '';
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Morning';
    else if (hour < 17) this.greeting = 'Afternoon';
    else this.greeting = 'Evening';

    this.loadDoors();
  }

  loadDoors(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.auth.isMockMode()) {
      // Static lastActivity – generated once per door (no random in template)
      this.doors = [
        { id: '1', name: 'Front Door', home: 'Main Home', status: 'online', lastActivity: '2 hours ago' },
        { id: '2', name: 'Back Door', home: 'Main Home', status: 'online', lastActivity: '5 hours ago' },
        { id: '3', name: 'Office Door', home: 'Work', status: 'offline', lastActivity: '1 day ago' },
        { id: '4', name: 'Garage Door', home: 'Main Home', status: 'locked', lastActivity: '10 minutes ago' }
      ];
      this.isLoading = false;
      return;
    }

    // Real API call – lastActivity may come from backend, else use default
    this.api.get<Door[]>('/devices').subscribe({
      next: (data) => {
        this.doors = data.map(door => ({
          ...door,
          lastActivity: door.lastActivity || 'Recently'
        }));
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
    return this.doors.filter(d => d.status === 'online' || d.status === 'locked').length;
  }

  get offlineCount(): number {
    return this.doors.filter(d => d.status === 'offline').length;
  }

  // Idempotency key using built‑in crypto (no uuid package)
  private generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  unlockDoor(doorId: string): void {
    const door = this.doors.find(d => d.id === doorId);
    if (!door) return;

    const idempotencyKey = this.generateIdempotencyKey();

    if (this.auth.isMockMode()) {
      alert(`🔓 Unlocking "${door.name}"...\n\n(Mock mode) Idempotency Key: ${idempotencyKey}`);
      return;
    }

    this.api.post(`/locks/${doorId}/unlock`, { idempotencyKey }).subscribe({
      next: () => {
        alert(`✅ Door "${door.name}" unlocked successfully!`);
        this.loadDoors();
      },
      error: (err) => {
        const msg = err.error?.error || 'Failed to unlock door.';
        alert(`❌ ${msg}`);
      }
    });
  }

  // --- Navigation / Actions ---
  logout(): void {
    this.auth.logout();
  }

  openSettings(): void {
    alert('⚙️ Settings page coming soon!');
  }

  openNotifications(): void {
    alert('🔔 Notifications coming soon!');
  }

  viewAllDoors(): void {
    alert('📋 Viewing all doors...');
    // Replace with: this.router.navigate(['/doors']);
  }

  addDoor(): void {
    alert('➕ Add new door wizard coming soon!');
  }

  viewAuditLog(): void {
    alert('📜 Loading audit logs...');
  }

  showDoorOptions(door: Door): void {
    alert(`⚙️ Options for "${door.name}"\n\n- Edit\n- View History\n- Delete`);
  }
}