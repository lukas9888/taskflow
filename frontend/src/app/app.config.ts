import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { enUS } from 'date-fns/locale';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    // DateFnsAdapter requires a date-fns Locale object, not LOCALE_ID string (breaks calendar + time list)
    { provide: MAT_DATE_LOCALE, useValue: enUS },
    provideDateFnsAdapter(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes)
  ]
};
