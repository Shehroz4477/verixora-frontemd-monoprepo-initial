import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { WebApiService } from '../core/web-api.service';
import { WebAuthService } from '../core/web-auth.service';
import { MonitoringHubService } from '../core/monitoring-hub.service';

interface Home { id: string; name: string; role: string; }
interface Controller { id: string; name: string; hardwareId: string; mqttTopic: string; status: string; createdAtUtc: string; provisionedAtUtc?: string | null; }
interface Lock { id: string; name: string; status: string; controllerStatus: string; requiresFace: boolean; lastUnlockedAtUtc?: string | null; }
interface AuditLog { id: string; action: string; timestamp: string; result: boolean; details?: string | null; }

@Component({
    selector: 'app-web-dashboard',
    templateUrl: './web-dashboard.component.html',
    styleUrls: ['./web-dashboard.component.scss'],
    standalone: false
})
export class WebDashboardComponent implements OnInit, OnDestroy {
  homes: Home[] = [];
  selectedHomeId = '';
  controllers: Controller[] = [];
  locks: Lock[] = [];
  auditLogs: AuditLog[] = [];
  loading = true;
  refreshing = false;
  error = '';
  lastUpdated: Date | null = null;
  private auditSubscription?: Subscription;
  private hasLoadedHome = false;

  constructor(private api: WebApiService, private auth: WebAuthService, private monitoringHub: MonitoringHubService) {}

  ngOnInit(): void {
    this.auditSubscription = this.monitoringHub.auditEvents$.subscribe(event => {
      if (event.homeId === this.selectedHomeId) this.loadSelectedHome();
    });
    const token = this.auth.token();
    if (token) this.monitoringHub.connect(token).catch(() => this.error = 'Live monitoring connection is unavailable; manual refresh remains available.');
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
    if (!this.selectedHomeId) {
      this.controllers = [];
      this.locks = [];
      this.auditLogs = [];
      this.loading = false;
      this.refreshing = false;
      return;
    }
    if (this.hasLoadedHome) this.refreshing = true;
    else this.loading = true;
    this.error = '';
    forkJoin({
      controllers: this.api.get<Controller[]>(`/devices?homeId=${encodeURIComponent(this.selectedHomeId)}`),
      locks: this.api.get<Lock[]>(`/locks?homeId=${encodeURIComponent(this.selectedHomeId)}`),
      audit: this.api.get<AuditLog[]>(`/auditlogs?homeId=${encodeURIComponent(this.selectedHomeId)}`)
    }).subscribe({
      next: result => {
        this.controllers = result.controllers;
        this.locks = result.locks;
        this.auditLogs = result.audit;
        this.lastUpdated = new Date();
        this.hasLoadedHome = true;
        this.loading = false;
        this.refreshing = false;
      },
      error: error => {
        this.error = error.error?.error || 'Could not load monitoring data.';
        this.loading = false;
        this.refreshing = false;
      }
    });
  }

  get onlineControllerCount(): number { return this.controllers.filter(controller => controller.status === 'Online').length; }
  get attentionCount(): number { return this.locks.filter(lock => lock.controllerStatus !== 'Online' || lock.status === 'EmergencyLocked').length; }
  get protectedDoorCount(): number { return this.locks.filter(lock => lock.requiresFace).length; }
  get latestAuditLogs(): AuditLog[] { return [...this.auditLogs].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 6); }
  get selectedHomeName(): string { return this.homes.find(home => home.id === this.selectedHomeId)?.name || 'Select a home'; }

  refresh(): void { this.loadSelectedHome(); }

  logout(): void { this.auth.logout(); }
}
