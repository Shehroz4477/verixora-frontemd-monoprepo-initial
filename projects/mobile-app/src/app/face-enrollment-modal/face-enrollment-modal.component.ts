import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';

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
  private capturedPhotos: string[] = [];
  private maxAttempts = 8;

  constructor(
    private modalController: ModalController,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.startEnrollment();
  }

  private async startEnrollment() {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.error = 'User not authenticated.';
      return;
    }

    let attempt = 0;
    let enrolled = false;

    while (!enrolled && attempt < this.maxAttempts) {
      attempt++;
      this.statusMessage = `Scanning (${attempt})...`;
      this.progress = (attempt / this.maxAttempts) * 100;

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
        this.capturedPhotos.push(image.base64String);
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('image', this.base64toBlob(image.base64String), 'face.jpg');

        try {
          const response = await this.api.postMultipart('/face/enroll', formData).toPromise() as any;
          if (response.status === 'enrolled') {
            enrolled = true;
            this.isComplete = true;
            this.progress = 100;
            this.statusMessage = 'Enrolled!';
            break;
          } else if (response.status === 'need_more') {
            // Continue loop
          } else {
            this.error = 'Unexpected response from server.';
            return;
          }
        } catch (err) {
          this.error = 'Enrollment failed. Please try again.';
          return;
        }
      }
    }

    if (!enrolled && !this.isComplete) {
      this.error = 'Could not enroll face. Please try again.';
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