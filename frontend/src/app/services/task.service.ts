import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskItem } from '../models/task-item';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  /** Must match the URL shown when you run the API (see backend launchSettings / terminal). */
  readonly baseUrl = 'http://localhost:5046/api/tasks';

  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(this.baseUrl);
  }

  createTask(title: string): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.baseUrl, { title });
  }

  updateTask(id: number, title: string): Observable<TaskItem> {
  return this.http.put<TaskItem>(`${this.baseUrl}/${id}`, { title });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
