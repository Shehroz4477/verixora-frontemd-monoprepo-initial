import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

interface HomeDto {
  id: string;
  name: string;
  role: string;
}

interface AuditLogDto {
  id: string;
  action: string;
  timestamp: string;
  result: boolean;
  details?: string | null;
}

interface ActivityItem extends AuditLogDto {
  homeName: string;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false
})
export class NotificationsComponent implements OnInit {
  readonly title = 'Security activity';
  activity: ActivityItem[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadActivity();
  }

  goBack(): void {
    this.router.navigate(['tabs/home']);
  }

  loadActivity(event?: CustomEvent): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.auth.isMockMode()) {
      this.activity = [
        { id: 'mock-1', homeName: 'Main Home', action: 'ControllerAcknowledgement', timestamp: new Date().toISOString(), result: true, details: 'Mock controller acknowledgement.' },
        { id: 'mock-2', homeName: 'Main Home', action: 'UnlockRequest', timestamp: new Date(Date.now() - 60_000).toISOString(), result: false, details: 'Mock face verification required.' }
      ];
      this.finishRefresh(event);
      return;
    }

    this.api.get<HomeDto[]>('/homes').pipe(
      switchMap(homes => {
        const ownerHomes = homes.filter(home => home.role === 'Owner');
        if (ownerHomes.length === 0) return of([] as ActivityItem[]);
        return forkJoin(ownerHomes.map(home =>
          this.api.get<AuditLogDto[]>(`/auditlogs?homeId=${encodeURIComponent(home.id)}`).pipe(
            map(events => events.map(item => ({ ...item, homeName: home.name })))
          )
        )).pipe(map(groups => groups.flat()));
      }),
      map(items => items.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()))
    ).subscribe({
      next: items => { this.activity = items; this.finishRefresh(event); },
      error: error => {
        this.errorMessage = error?.error?.error || 'Could not load security activity.';
        this.finishRefresh(event);
      }
    });
  }

  formatTimestamp(value: string): string {
    return new Date(value).toLocaleString();
  }

  private finishRefresh(event?: CustomEvent): void {
    this.isLoading = false;
    const target = event?.target as { complete?: () => void } | undefined;
    target?.complete?.();
  }
}
