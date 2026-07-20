import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-devices',
    templateUrl: './devices.component.html',
    styleUrl: './devices.component.scss',
    standalone: false
})
export class DevicesComponent {
  title = 'Devices';

  constructor(private router: Router) { }

  goBack() {
    this.router.navigate(['tabs/home']);
  }

}
