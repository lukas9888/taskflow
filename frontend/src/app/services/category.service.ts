import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CreateCategoryBody = { name: string };

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl);
  }

  createCategory(name: string): Observable<string> {
    return this.http.post<string>(this.baseUrl, { name } satisfies CreateCategoryBody);
  }
}

