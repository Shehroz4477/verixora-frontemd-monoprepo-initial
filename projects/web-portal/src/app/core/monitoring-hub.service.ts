import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditNotification {
  id: string;
  homeId: string;
  deviceId: string;
  userId: string;
  action: string;
  result: boolean;
  details?: string | null;
  timestampUtc: string;
}

@Injectable({ providedIn: 'root' })
export class MonitoringHubService {
  private connection?: HubConnection;
  private readonly auditSubject = new Subject<AuditNotification>();
  readonly auditEvents$ = this.auditSubject.asObservable();

  async connect(accessToken: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected || this.connection?.state === HubConnectionState.Connecting) return;
    const hubUrl = environment.apiUrl.replace(/\/api\/v1$/, '') + '/hubs/system-monitoring';
    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .build();
    this.connection.on('auditLogged', (event: AuditNotification) => this.auditSubject.next(event));
    await this.connection.start();
  }

  async disconnect(): Promise<void> {
    if (this.connection) await this.connection.stop();
    this.connection = undefined;
  }
}
