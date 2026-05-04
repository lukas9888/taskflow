import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskItem } from '../models/task-item';

export type UpdateTaskBody = {
  title: string;
  dueAt: string | null;
  priority: string;
  category: string;
  description: string | null;
};

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

  createTask(title: string, dueAt: string | null): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.baseUrl, { title, dueAt });
  }

  updateTask(id: number, body: UpdateTaskBody): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.baseUrl}/${id}`, body);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
