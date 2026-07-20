import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-face-enrollment',
  templateUrl: './face-enrollment.component.html',
  styleUrls: ['./face-enrollment.component.scss']
})
export class FaceEnrollmentComponent implements OnInit, OnDestroy {
  statusMessage: string = 'Scanning face...';
  progress: number = 0;
  isComplete: boolean = false;
  error: string = '';
  private readonly requiredFrames = 3;
  private isActive = true;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.startEnrollment();
  }

  private async startEnrollment() {
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
        this.goBack();
        return;
      }

      if (image?.base64String && this.isActive) {
        photos.push(image.base64String);
      }
    }

    if (!this.isActive || photos.length !== this.requiredFrames) {
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
    } catch (err: any) {
      this.error = err?.error?.error || 'Enrollment failed. Please try again.';
    }
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  retry() {
    this.error = '';
    this.progress = 0;
    this.statusMessage = 'Scanning face...';
    this.isComplete = false;
    this.startEnrollment();
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
