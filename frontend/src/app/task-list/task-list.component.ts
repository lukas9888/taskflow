import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatNavList } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TaskRowComponent } from '../task-row/task-row.component';
import { TaskItem, TaskPriorityLevel } from '../models/task-item';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';
import {
  priorityIconCssColor,
  priorityIconGlyph,
  TASK_PRIORITY_OPTIONS,
  taskCategoryFromModel,
  taskPriorityFromModel,
} from '../task-ux';

export type TaskListFilter = 'today' | 'week' | 'all';
export type DependencyFilter = 'all' | 'blocked' | 'blocking';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
  TaskRowComponent,
  MatButtonToggleModule,
  MatNavList,
  MatCardModule,
  FormsModule,
  MatFormFieldModule,
  MatIconModule,
  MatSelectModule,
  MatButtonModule,
  ],
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
  showFilters = false;
  selectedCategories: string[] = [];
  selectedPriorities: TaskPriorityLevel[] = [];
  dependencyFilter: DependencyFilter = 'all';

readonly priorityOptions = TASK_PRIORITY_OPTIONS;

  get visibleTasks(): TaskItem[] {
  const list = this.filterByTab(this.filteredTasks);
  return [...list].sort((a, b) => this.compareTasks(a, b));
}

  get overdueTasks(): TaskItem[] {
  return this.filteredTasks
    .filter((t) => this.isOverdue(t))
    .sort((a, b) => this.compareTasks(a, b));
}

  get activeTasks(): TaskItem[] {
    return this.visibleTasks.filter((t) => !t.done && !this.isOverdue(t));
  }

  get doneTasks(): TaskItem[] {
    return this.visibleTasks.filter((t) => t.done);
  }

  get categoryOptions(): string[] {
  return [...new Set(this.tasks.map((t) => taskCategoryFromModel(t)).filter(Boolean))].sort();
}

priorityIcon(level: TaskPriorityLevel): string {
  return priorityIconGlyph(level);
}

priorityColor(level: TaskPriorityLevel): string {
  return priorityIconCssColor(level);
}

clearTaskFilters(): void {
  this.selectedCategories = [];
  this.selectedPriorities = [];
  this.dependencyFilter = 'all';
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

  private get filteredTasks(): TaskItem[] {
  return this.filterByTaskFilters(this.tasks);
}

  private filterByTaskFilters(all: TaskItem[]): TaskItem[] {
    return all.filter((task) => {
      const category = taskCategoryFromModel(task);
      const priority = taskPriorityFromModel(task);

      const matchesCategory =
        this.selectedCategories.length === 0 || this.selectedCategories.includes(category);

      const matchesPriority =
        this.selectedPriorities.length === 0 || this.selectedPriorities.includes(priority);

      const matchesDependency =
        this.dependencyFilter === 'all' ||
        (this.dependencyFilter === 'blocked' && this.blockedTaskIds.has(task.id)) ||
        (this.dependencyFilter === 'blocking' && this.blockingTaskIds.has(task.id));

      return matchesCategory && matchesPriority && matchesDependency;
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
