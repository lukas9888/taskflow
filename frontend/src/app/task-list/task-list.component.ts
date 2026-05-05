import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNavList } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { TaskRowComponent } from '../task-row/task-row.component';
import { TaskItem } from '../models/task-item';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';

export type TaskListFilter = 'today' | 'week' | 'all';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskRowComponent, MatButtonToggleModule, MatNavList, MatCardModule, FormsModule,],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent {
  private readonly due = inject(DueDatetimeService);
  private readonly taskService = inject(TaskService);

  @Input() tasks: TaskItem[] = [];
  @Input() selectedTaskId: number | null = null;
  @Input() blockedTaskIds = new Set<number>();
  @Input() blockingTaskIds = new Set<number>();
  @Output() readonly selectedTaskIdChange = new EventEmitter<number | null>();
  @Output() readonly taskUpdated = new EventEmitter<void>();

  listFilter: TaskListFilter = 'today';

  get visibleTasks(): TaskItem[] {
  const list = this.filterByTab(this.tasks);
  return [...list].sort((a, b) => this.compareTasks(a, b));
  }

  get overdueTasks(): TaskItem[] {
    return this.tasks
      .filter((t) => this.isOverdue(t))
      .sort((a, b) => this.compareTasks(a, b));
  }

  get activeTasks(): TaskItem[] {
    return this.visibleTasks.filter((t) => !t.done && !this.isOverdue(t));
  }

  get doneTasks(): TaskItem[] {
    return this.visibleTasks.filter((t) => t.done);
  }

  onCompletedChange(task: TaskItem, done: boolean): void {
  this.taskService
    .updateTask(task.id, {
      title: task.title,
      dueAt: task.dueAt,
      priority: task.priority,
      category: task.category,
      description: task.description,
      done
    })
    .subscribe({
      next: (updated) => {
        this.tasks = this.tasks.map((t) => (t.id === updated.id ? updated : t));
        this.taskUpdated.emit();
      }
    });
  }

  private filterByTab(all: TaskItem[]): TaskItem[] {
    const today = this.due.startOfToday();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    switch (this.listFilter) {
      case 'today':
        return all.filter((t) => {
          if (!t.dueAt) {
            return false;
          }
          return this.due.isSameLocalDay(new Date(t.dueAt), today);
        });
      case 'week':
        return all.filter((t) => {
          if (!t.dueAt) {
            return false;
          }
          const day = this.due.startOfLocalDay(new Date(t.dueAt));
          return day.getTime() >= today.getTime() && day.getTime() <= weekEnd.getTime();
        });
      default:
        return all;
    }
  }

  private isOverdue(task: TaskItem): boolean {
  if (task.done || !task.dueAt) {
    return false;
  }

  return new Date(task.dueAt).getTime() < Date.now();
  }

  private compareTasks(a: TaskItem, b: TaskItem): number {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    }
    if (a.dueAt) {
      return -1;
    }
    if (b.dueAt) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  }
}
