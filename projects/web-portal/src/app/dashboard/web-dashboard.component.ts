import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { WebApiService } from '../core/web-api.service';
import { WebAuthService } from '../core/web-auth.service';

interface Home { id: string; name: string; role: string; }
interface Lock { id: string; name: string; status: string; controllerStatus: string; requiresFace: boolean; lastUnlockedAtUtc?: string | null; }
interface AuditLog { id: string; action: string; timestampUtc: string; result: boolean; details?: string | null; }

@Component({
  selector: 'app-web-dashboard',
  templateUrl: './web-dashboard.component.html',
  styleUrls: ['./web-dashboard.component.scss']
})
export class WebDashboardComponent implements OnInit {
  homes: Home[] = [];
  selectedHomeId = '';
  locks: Lock[] = [];
  auditLogs: AuditLog[] = [];
  loading = true;
  error = '';

  constructor(private api: WebApiService, private auth: WebAuthService) {}

  ngOnInit(): void { this.loadHomes(); }

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
