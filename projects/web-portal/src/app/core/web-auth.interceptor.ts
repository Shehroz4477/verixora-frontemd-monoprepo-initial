import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WebAuthService } from './web-auth.service';

@Injectable()
export class WebAuthInterceptor implements HttpInterceptor {
  constructor(private auth: WebAuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token();
    return next.handle(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
  }
}
