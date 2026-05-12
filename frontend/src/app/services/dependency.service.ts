import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { TaskDependency } from '../models/task-dependency';

@Injectable({ providedIn: 'root' })
export class DependencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5046/api/tasks';

  private readonly depsSubject = new BehaviorSubject<TaskDependency[] | null>(null);

  private inFlight$: Observable<TaskDependency[]> | null = null;

  /**
   * Loads the user's dependency relationships once and caches them in memory.
   * Use `force=true` after add/remove to refresh.
   */
  loadAllForUser(force = false): Observable<TaskDependency[]> {
    const current = this.depsSubject.value;
    if (!force && current != null) {
      return of(current);
    }

    if (!force && this.inFlight$) {
      return this.inFlight$;
    }

    const req$ = this.getAllForUser().pipe(
      tap((deps) => this.depsSubject.next(deps)),
      finalize(() => {
        if (this.inFlight$ === req$) this.inFlight$ = null;
      }),
      shareReplay(1)
    );

    this.inFlight$ = req$;
    return req$;
  }

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