import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskDependency } from '../models/task-dependency';

@Injectable({ providedIn: 'root' })
export class DependencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/tasks`;

  /** GET /api/tasks/dependencies — all dependency edges for the current user (no client-side cache). */
  getAllForUser(): Observable<TaskDependency[]> {
    return this.http.get<TaskDependency[]>(`${this.baseUrl}/dependencies`);
  }

  add(taskId: number, blockedById: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${taskId}/dependencies`, { blockedById });
  }

  remove(taskId: number, blockedById: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${taskId}/dependencies/${blockedById}`);
  }
}
