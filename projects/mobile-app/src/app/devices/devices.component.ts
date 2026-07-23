import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { describeApiError } from '../core/utils/api-error';

interface HomeDto {
  id: string;
  name: string;
  role: string;
}

interface ControllerDto {
  id: string;
  homeId: string;
  name: string;
  hardwareId: string;
  mqttTopic: string;
  status: 'Pending' | 'Active' | 'Online' | 'Offline' | 'Decommissioned';
  createdAtUtc: string;
  provisionedAtUtc?: string | null;
}

interface ControllerRegistrationResult {
  deviceId: string;
  mqttTopic: string;
  status: string;
  hardwareId: string;
  provisioningToken: string;
  provisioningExpiresAtUtc: string;
}

interface LockRegistrationResult {
  id: string;
  name: string;
}

interface ProvisioningReceipt {
  deviceId: string;
  hardwareId: string;
  mqttTopic: string;
  token: string;
  expiresAtUtc: string;
}

@Component({
  selector: 'app-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  standalone: false
})
export class DevicesComponent implements OnInit {
  readonly title = 'Door controllers';
  homes: HomeDto[] = [];
  controllers: ControllerDto[] = [];
  selectedHomeId = '';
  selectedControllerId = '';
  controllerName = '';
  hardwareId = '';
  doorName = '';
  requiresFace = true;
  isLoading = true;
  isSavingController = false;
  isSavingDoor = false;
  errorMessage = '';
  successMessage = '';
  provisioningReceipt: ProvisioningReceipt | null = null;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadHomes();
  }

  goBack(): void {
    this.router.navigate(['tabs/home']);
  }

  async loadHomes(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.auth.isMockMode()) {
      this.homes = [{ id: 'mock-home', name: 'Main Home', role: 'Owner' }];
      this.selectedHomeId = this.homes[0].id;
      this.controllers = [];
      this.isLoading = false;
      return;
    }

    try {
      this.homes = await firstValueFrom(this.api.get<HomeDto[]>('/homes'));
      this.selectedHomeId = this.homes.find(home => home.role === 'Owner')?.id || this.homes[0]?.id || '';
      await this.loadControllers();
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not load your homes.');
    } finally {
      this.isLoading = false;
    }
  }

  async onHomeChanged(): Promise<void> {
    this.provisioningReceipt = null;
    this.successMessage = '';
    await this.loadControllers();
  }

  async loadControllers(): Promise<void> {
    this.controllers = [];
    this.selectedControllerId = '';
    if (!this.selectedHomeId || this.auth.isMockMode()) return;

    try {
      this.controllers = await firstValueFrom(this.api.get<ControllerDto[]>(`/devices?homeId=${encodeURIComponent(this.selectedHomeId)}`));
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Could not load controllers for this home.');
    }
  }

  async registerController(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.provisioningReceipt = null;
    const name = this.controllerName.trim();
    const hardwareId = this.hardwareId.trim();

    if (!this.selectedHomeId || !name || !hardwareId) {
      this.errorMessage = 'Choose a home and enter both the controller name and its QR/serial hardware ID.';
      return;
    }
    if (!this.isOwnerOfSelectedHome()) {
      this.errorMessage = 'Only the owner of a home can register a controller.';
      return;
    }

    this.isSavingController = true;
    try {
      if (this.auth.isMockMode()) {
        this.provisioningReceipt = {
          deviceId: 'mock-controller',
          hardwareId,
          mqttTopic: 'verixora/mock-controller',
          token: 'local-demo-provisioning-token',
          expiresAtUtc: new Date(Date.now() + 10 * 60_000).toISOString()
        };
        this.controllers = [{
          id: 'mock-controller', homeId: this.selectedHomeId, name, hardwareId, mqttTopic: 'verixora/mock-controller',
          status: 'Pending', createdAtUtc: new Date().toISOString()
        }];
      } else {
        const result = await firstValueFrom(this.api.post<ControllerRegistrationResult>('/devices', {
          homeId: this.selectedHomeId,
          name,
          hardwareId
        }));
        this.provisioningReceipt = {
          deviceId: result.deviceId,
          hardwareId: result.hardwareId,
          mqttTopic: result.mqttTopic,
          token: result.provisioningToken,
          expiresAtUtc: result.provisioningExpiresAtUtc
        };
        await this.loadControllers();
      }
      this.controllerName = '';
      this.hardwareId = '';
      this.successMessage = 'Controller is pending secure provisioning. Complete the physical provisioning before creating its door.';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Controller registration failed.');
    } finally {
      this.isSavingController = false;
    }
  }

  async createDoor(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    const controller = this.controllers.find(item => item.id === this.selectedControllerId);
    const name = this.doorName.trim();

    if (!controller || !name) {
      this.errorMessage = 'Select a provisioned controller and enter a door name.';
      return;
    }
    if (!this.isControllerReady(controller)) {
      this.errorMessage = 'This controller is not provisioned yet. A door can only be created after the controller is Active or Online.';
      return;
    }

    this.isSavingDoor = true;
    try {
      if (this.auth.isMockMode()) {
        this.successMessage = `Door "${name}" was created for the mock controller.`;
      } else {
        const result = await firstValueFrom(this.api.post<LockRegistrationResult>('/locks', {
          homeId: this.selectedHomeId,
          deviceId: controller.id,
          name,
          requiresFace: this.requiresFace
        }));
        this.successMessage = `Door "${result.name}" is now linked to ${controller.name}.`;
      }
      this.doorName = '';
    } catch (error) {
      this.errorMessage = this.apiError(error, 'Door creation failed.');
    } finally {
      this.isSavingDoor = false;
    }
  }

  async copyProvisioningToken(): Promise<void> {
    if (!this.provisioningReceipt) return;
    try {
      await navigator.clipboard.writeText(this.provisioningReceipt.token);
      this.successMessage = 'The one-time provisioning token was copied. Keep it private and use it before it expires.';
    } catch {
      this.errorMessage = 'Copy is unavailable on this device. Select the token manually; never send it through chat or email.';
    }
  }

  isControllerReady(controller: ControllerDto): boolean {
    return controller.status === 'Active' || controller.status === 'Online';
  }

  selectedHomeName(): string {
    return this.homes.find(home => home.id === this.selectedHomeId)?.name || 'this home';
  }

  formatTimestamp(value?: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Not provisioned';
  }

  private isOwnerOfSelectedHome(): boolean {
    return this.homes.find(home => home.id === this.selectedHomeId)?.role === 'Owner';
  }

  private apiError(error: unknown, fallback: string): string {
    return describeApiError(error, fallback);
  }
}
