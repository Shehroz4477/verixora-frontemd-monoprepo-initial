import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss'],
    standalone: false
})
export class TabsComponent {
  constructor(private router: Router) {}

  async startFaceEnrollment() {
    this.router.navigate(['/face-enrollment']);
  }
}