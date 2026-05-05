import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { TaskDetailPaneComponent } from '../task-detail-pane/task-detail-pane.component';
import { TaskItem } from '../models/task-item';
import { TaskService } from '../services/task.service';
import { DependencyService } from '../services/dependency.service';

@Component({
  selector: 'app-tasks-page',
  imports: [
    TaskFormComponent,
    TaskListComponent,
    TaskDetailPaneComponent,
    MatCardModule,
    MatSidenavModule
  ],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.css'
})
export class TasksPageComponent implements OnInit {
  blockedTaskIds = new Set<number>();
  blockingTaskIds = new Set<number>();
  private readonly deps = inject(DependencyService);
  private readonly taskService = inject(TaskService);
  private readonly breakpoint = inject(BreakpointObserver);

  /** Matches task-detail-pane / list responsive breakpoint. */
  readonly isNarrow = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  /** Pixels under the sticky app toolbar (see `styles.scss` `--app-toolbar-total-height`). */
  readonly toolbarTopGapPx = 64;

  tasks: TaskItem[] = [];
  loadError: string | null = null;
  selectedTaskId: number | null = null;
  

  get selectedTask(): TaskItem | null {
    if (this.selectedTaskId == null) {
      return null;
    }
    return this.tasks.find((t) => t.id === this.selectedTaskId) ?? null;
  }

  ngOnInit(): void {
    this.refreshTasks();
  }

  onSelectedTaskIdChange(id: number | null): void {
    this.selectedTaskId = id;
  }

  onDetailClosed(): void {
    this.selectedTaskId = null;
  }

  onTaskDeletedFromPane(): void {
    this.selectedTaskId = null;
    this.refreshTasks();
  }

  refreshTasks(): void {
    this.loadError = null;
    forkJoin({
      tasks: this.taskService.getTasks(),
      dependencies: this.deps.loadAllForUser()
    }).subscribe({
      next: ({ tasks, dependencies }) => {
        this.tasks = tasks;
        if (
          this.selectedTaskId != null &&
          !tasks.some((t) => t.id === this.selectedTaskId)
        ) {
          this.selectedTaskId = null;
        }

        this.applyDependencyState(tasks, dependencies);
      },
      error: () =>
        (this.loadError =
          'Could not load tasks. Are you logged in, and is the API running?')
    });
  }

  refreshDependencies(): void {
    this.deps
      .loadAllForUser(true)
      .subscribe((deps) => this.applyDependencyState(this.tasks, deps));
  }

  private applyDependencyState(
    tasks: TaskItem[],
    deps: { taskId: number; dependsOn: number }[]
  ): void {
    if (tasks.length === 0) {
      this.blockedTaskIds = new Set<number>();
      this.blockingTaskIds = new Set<number>();
      return;
    }

    const doneByTaskId = new Map(tasks.map((task) => [task.id, task.done]));
    const blocked = new Set<number>();
    const blocking = new Set<number>();

    for (const dep of deps) {
      if (doneByTaskId.get(dep.dependsOn) === false) {
        blocked.add(dep.taskId);
        blocking.add(dep.dependsOn);
      }
    }

    this.blockedTaskIds = blocked;
    this.blockingTaskIds = blocking;
  }
}
