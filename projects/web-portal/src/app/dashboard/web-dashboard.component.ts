import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { WebApiService } from '../core/web-api.service';
import { WebAuthService } from '../core/web-auth.service';
import { MonitoringHubService } from '../core/monitoring-hub.service';

interface Home { id: string; name: string; role: string; }
interface Lock { id: string; name: string; status: string; controllerStatus: string; requiresFace: boolean; lastUnlockedAtUtc?: string | null; }
interface AuditLog { id: string; action: string; timestampUtc: string; result: boolean; details?: string | null; }

@Component({
  selector: 'app-web-dashboard',
  templateUrl: './web-dashboard.component.html',
  styleUrls: ['./web-dashboard.component.scss']
})
export class WebDashboardComponent implements OnInit, OnDestroy {
  homes: Home[] = [];
  selectedHomeId = '';
  locks: Lock[] = [];
  auditLogs: AuditLog[] = [];
  loading = true;
  error = '';
  private auditSubscription?: Subscription;

  constructor(private api: WebApiService, private auth: WebAuthService, private monitoringHub: MonitoringHubService) {}

  ngOnInit(): void {
    this.auditSubscription = this.monitoringHub.auditEvents$.subscribe(event => {
      if (event.homeId === this.selectedHomeId) this.loadSelectedHome();
    });
    const token = this.auth.token();
    if (token) this.monitoringHub.connect(token).catch(() => this.error = 'Live monitoring connection is unavailable; refresh remains available.');
    this.loadHomes();
  }

  ngOnDestroy(): void {
    this.auditSubscription?.unsubscribe();
    this.monitoringHub.disconnect().catch(() => undefined);
  }

  loadHomes(): void {
    this.loading = true;
    this.api.get<Home[]>('/homes').subscribe({
      next: homes => {
        this.homes = homes;
        this.selectedHomeId = homes[0]?.id || '';
        this.loadSelectedHome();
      },
      error: error => { this.error = error.error?.error || 'Could not load your homes.'; this.loading = false; }
    });
  }

  loadSelectedHome(): void {
    if (!this.selectedHomeId) { this.locks = []; this.auditLogs = []; this.loading = false; return; }
    this.loading = true;
    this.error = '';
    forkJoin({
      locks: this.api.get<Lock[]>(`/locks?homeId=${encodeURIComponent(this.selectedHomeId)}`),
      audit: this.api.get<AuditLog[]>(`/auditlogs?homeId=${encodeURIComponent(this.selectedHomeId)}`)
    }).subscribe({
      next: result => { this.locks = result.locks; this.auditLogs = result.audit; this.loading = false; },
      error: error => { this.error = error.error?.error || 'Could not load monitoring data.'; this.loading = false; }
    });
  }

  logout(): void { this.auth.logout(); }
}
