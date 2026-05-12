import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskItem } from '../models/task-item';

export type UpdateTaskBody = {
  title: string;
  dueAt: string | null;
  priority: string;
  category: string | null;
  description: string | null;
  done: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = `${environment.apiBaseUrl}/tasks`;

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
