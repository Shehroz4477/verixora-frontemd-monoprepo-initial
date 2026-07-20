import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-face-enrollment-modal',
  templateUrl: './face-enrollment-modal.component.html',
  styleUrls: ['./face-enrollment-modal.component.scss']
})
export class FaceEnrollmentModalComponent implements OnInit {
  statusMessage: string = 'Scanning face...';
  progress: number = 0;
  isComplete: boolean = false;
  error: string = '';
  corners = [1, 2, 3, 4];
  private readonly requiredFrames = 3;

  constructor(
    private modalController: ModalController,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.startEnrollment();
  }

  private async startEnrollment() {
    const photos: string[] = [];
    for (let index = 0; index < this.requiredFrames; index++) {
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
        // User cancelled – close modal
        this.modalController.dismiss();
        return;
      }

      if (image?.base64String) {
        photos.push(image.base64String);
      }
    }

    if (photos.length !== this.requiredFrames) {
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

  close() {
    this.modalController.dismiss();
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
}
