import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  title = 'Alerts';

    constructor(private router: Router) { }
  
    goBack() {
      this.router.navigate(['tabs/home']);
    }

}
