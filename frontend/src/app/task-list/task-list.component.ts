import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNavList } from '@angular/material/list';
import { TaskRowComponent } from '../task-row/task-row.component';
import { TaskItem } from '../models/task-item';
import { DueDatetimeService } from '../services/due-datetime.service';

export type TaskListFilter = 'today' | 'week' | 'all';

@Component({
  selector: 'app-task-list',
  imports: [TaskRowComponent, MatButtonToggleModule, MatNavList, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent {
  private readonly due = inject(DueDatetimeService);

  @Input() tasks: TaskItem[] = [];
  @Input() selectedTaskId: number | null = null;
  @Output() readonly selectedTaskIdChange = new EventEmitter<number | null>();

  listFilter: TaskListFilter = 'today';

  /** Client-only completion (API has no completed flag yet). */
  completedTaskIds = new Set<number>();

  get visibleTasks(): TaskItem[] {
    const list = this.filterByTab(this.tasks);
    return [...list].sort((a, b) => this.compareTasks(a, b));
  }

  onCompletedChange(taskId: number, done: boolean): void {
    const next = new Set(this.completedTaskIds);
    if (done) {
      next.add(taskId);
    } else {
      next.delete(taskId);
    }
    this.completedTaskIds = next;
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

  private compareTasks(a: TaskItem, b: TaskItem): number {
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
