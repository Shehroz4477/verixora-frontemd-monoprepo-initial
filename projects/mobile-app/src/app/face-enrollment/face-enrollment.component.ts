import { Component, OnInit, OnDestroy } from '@angular/core';
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
  statusMessage: string = 'Ready when you are.';
  progress: number = 0;
  isComplete: boolean = false;
  isCapturing: boolean = false;
  error: string = '';
  private readonly requiredFrames = 3;
  private isActive = true;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    // Camera access is a deliberate user action. Opening this screen must not
    // immediately launch capture or make an unexpected biometric request.
  }

  beginEnrollment(): void {
    if (this.isCapturing || !this.isActive) return;
    this.error = '';
    this.progress = 0;
    this.statusMessage = 'Preparing secure camera capture…';
    void this.startEnrollment();
  }

  private async startEnrollment() {
    this.isCapturing = true;
    const photos: string[] = [];
    for (let index = 0; index < this.requiredFrames && this.isActive; index++) {
      this.statusMessage = `Capture ${index + 1} of ${this.requiredFrames}`;
      this.progress = (index / this.requiredFrames) * 100;

      let image;
      try {
        image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
      } catch (e) {
        // User cancelled – go back
        this.isCapturing = false;
        this.error = 'Face enrollment was cancelled. No biometric data was saved.';
        return;
      }

      if (image?.base64String && this.isActive) {
        photos.push(image.base64String);
      }
    }

    if (!this.isActive || photos.length !== this.requiredFrames) {
      this.isCapturing = false;
      this.error = 'Three clear face captures are required.';
      return;
    }

    const formData = new FormData();
    photos.forEach((photo, index) => formData.append('images', this.base64toBlob(photo), `face-${index + 1}.jpg`));
    try {
      await firstValueFrom(this.api.postMultipart<{ status: string }>('/face/enroll', formData));
      this.isComplete = true;
      this.progress = 100;
      this.statusMessage = 'Face enrolled';
    } catch (error) {
      this.error = describeApiError(error, 'Face enrollment could not be completed. No biometric data was saved.');
    } finally {
      this.isCapturing = false;
    }
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  retry() {
    this.error = '';
    this.progress = 0;
    this.statusMessage = 'Ready when you are.';
    this.isComplete = false;
    this.beginEnrollment();
  }

  private base64toBlob(base64: string): Blob {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
  }

  ngOnDestroy() {
    this.isActive = false;
  }
}
