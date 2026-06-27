import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
   title = 'Profile';

     constructor(private router: Router) { }
   
     goBack() {
       this.router.navigate(['tabs/home']);
     }

}
