import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CreateCategoryBody = { name: string };

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  /** Must match the URL shown when you run the API (see backend launchSettings / terminal). */
  readonly baseUrl = 'http://localhost:5046/api/categories';

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl);
  }

  createCategory(name: string): Observable<string> {
    return this.http.post<string>(this.baseUrl, { name } satisfies CreateCategoryBody);
  }
}

