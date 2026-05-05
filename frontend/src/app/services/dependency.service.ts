import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskDependency } from '../models/task-dependency';

@Injectable({ providedIn: 'root' })
export class DependencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5046/api/tasks';

  getAll(taskId: number): Observable<TaskDependency[]> {
    return this.http.get<TaskDependency[]>(`${this.baseUrl}/${taskId}/dependencies`);
  }

  add(taskId: number, dependsOnId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${taskId}/dependencies`, { dependsOnId });
  }

  remove(taskId: number, dependsOnId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${taskId}/dependencies/${dependsOnId}`);
  }
}