import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { describeApiError } from '../core/utils/api-error';

@Component({
  selector: 'app-face-enrollment',
  templateUrl: './face-enrollment.component.html',
  styleUrls: ['./face-enrollment.component.scss'],
  standalone: false
})
export class FaceEnrollmentComponent implements OnInit, OnDestroy {
  statusMessage = 'Ready when you are.';
  progress = 0;
  isComplete = false;
  isCapturing = false;
  hasStarted = false;
  capturedFrames = 0;
  error = '';

  readonly challenges = [
    'Look straight ahead and keep your full face inside the frame.',
    'Turn your head slightly to the left, then hold still.',
    'Turn your head slightly to the right, then hold still.'
  ];

  private readonly requiredFrames = 3;
  private isActive = true;
  private photos: string[] = [];

  constructor(
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly zone: NgZone
  ) {}

  ngOnInit(): void {
    // The camera only opens after an explicit user action.
  }

  get currentChallenge(): string {
    return this.challenges[Math.min(this.capturedFrames, this.requiredFrames - 1)];
  }

  beginEnrollment(): void {
    if (this.isCapturing || !this.isActive) return;
    this.resetSession();
    this.hasStarted = true;
    this.statusMessage = 'Your first guided capture is ready.';
  }

  async captureNextFrame(): Promise<void> {
    if (!this.hasStarted || this.isCapturing || this.isComplete || !this.isActive) return;

    this.updateState(() => {
      this.isCapturing = true;
      this.error = '';
      this.statusMessage = `Opening camera for capture ${this.capturedFrames + 1} of ${this.requiredFrames}.`;
    });

    try {
      const image = await Camera.getPhoto({
        quality: 88,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true
      });

      if (!image.base64String || !this.isActive) {
        this.updateState(() => this.error = 'The camera did not return a usable photo. No biometric data was saved.');
        return;
      }

      this.updateState(() => {
        this.photos.push(image.base64String!);
        this.capturedFrames = this.photos.length;
        this.progress = Math.round((this.capturedFrames / this.requiredFrames) * 100);
        this.statusMessage = this.capturedFrames === this.requiredFrames
          ? 'Checking your three encrypted captures.'
          : `Capture ${this.capturedFrames} accepted. Continue with the next guidance.`;
      });

      if (this.photos.length === this.requiredFrames) await this.submitEnrollment();
    } catch {
      this.updateState(() => this.error = 'Camera capture was cancelled. No biometric data was saved.');
    } finally {
      this.updateState(() => this.isCapturing = false);
    }
  }

  goBack(): void {
    this.router.navigate(['/tabs/home']);
  }

  retry(): void {
    this.resetSession();
    this.hasStarted = true;
    this.statusMessage = 'Start again with a clear, well-lit first capture.';
  }

  ngOnDestroy(): void {
    this.isActive = false;
    this.photos = [];
  }

  private async submitEnrollment(): Promise<void> {
    if (!this.isActive || this.photos.length !== this.requiredFrames) return;

    const formData = new FormData();
    this.photos.forEach((photo, index) => formData.append('images', this.base64toBlob(photo), `face-${index + 1}.jpg`));

    try {
      await firstValueFrom(this.api.postMultipart<{ status: string }>('/face/enroll', formData));
      this.updateState(() => {
        this.isComplete = true;
        this.progress = 100;
        this.statusMessage = 'Face enrollment updated securely.';
        this.photos = [];
      });
    } catch (error) {
      this.updateState(() => {
        this.error = describeApiError(error, 'Face enrollment could not be completed. No biometric data was saved.');
        this.photos = [];
      });
    }
  }

  private base64toBlob(base64: string): Blob {
    const byteString = atob(base64);
    const bytes = new Uint8Array(byteString.length);
    for (let index = 0; index < byteString.length; index++) bytes[index] = byteString.charCodeAt(index);
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  private resetSession(): void {
    this.error = '';
    this.progress = 0;
    this.isComplete = false;
    this.capturedFrames = 0;
    this.photos = [];
  }

  private updateState(update: () => void): void {
    this.zone.run(update);
  }
}
