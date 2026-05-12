import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
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
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
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

  readonly displayedColumns: string[] = [
    'completed',
    'title',
    'dependency',
    'priority',
    'category',
    'dueAt',
  ];

  readonly priorityOptions = TASK_PRIORITY_OPTIONS;

  get visibleTasks(): TaskItem[] {
    return this.sortTasks(this.filterByTab(this.filteredTasks));
  }

  get overdueTasks(): TaskItem[] {
    return this.sortTasks(this.filteredTasks.filter((task) => this.isOverdue(task)));
  }

  get activeTasks(): TaskItem[] {
    return this.visibleTasks.filter((task) => !task.done && !this.isOverdue(task));
  }

  get doneTasks(): TaskItem[] {
    return this.visibleTasks.filter((task) => task.done);
  }

  get categoryOptions(): string[] {
    const categories = this.tasks
      .map((task) => taskCategoryFromModel(task))
      .filter((category): category is string => Boolean(category));

    return [...new Set(categories)].sort();
  }

  priorityIcon(level: TaskPriorityLevel): string {
    return priorityIconGlyph(level);
  }

  priorityColor(level: TaskPriorityLevel): string {
    return priorityIconCssColor(level);
  }

  priorityLabel(level: TaskPriorityLevel): string {
    return level[0].toUpperCase() + level.slice(1);
  }

  priorityMarker(task: TaskItem): { icon: string; color: string } {
    const level = taskPriorityFromModel(task);

    return {
      icon: priorityIconGlyph(level),
      color: priorityIconCssColor(level),
    };
  }

  categoryLabel(task: TaskItem): string {
    return taskCategoryFromModel(task);
  }

  selectTask(task: TaskItem): void {
    this.selectedTaskIdChange.emit(task.id);
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
        done,
      })
      .subscribe({
        next: (updatedTask) => {
          this.tasks = this.tasks.map((existingTask) =>
            existingTask.id === updatedTask.id ? updatedTask : existingTask
          );

          this.taskUpdated.emit();
        },
      });
  }

  private get filteredTasks(): TaskItem[] {
    return this.tasks.filter((task) => this.matchesTaskFilters(task));
  }

  private matchesTaskFilters(task: TaskItem): boolean {
    const category = taskCategoryFromModel(task);
    const priority = taskPriorityFromModel(task);

    const matchesCategory =
      this.selectedCategories.length === 0 ||
      this.selectedCategories.includes(category);

    const matchesPriority =
      this.selectedPriorities.length === 0 ||
      this.selectedPriorities.includes(priority);

    const matchesDependency =
      this.dependencyFilter === 'all' ||
      (this.dependencyFilter === 'blocked' && this.blockedTaskIds.has(task.id)) ||
      (this.dependencyFilter === 'blocking' && this.blockingTaskIds.has(task.id));

    return matchesCategory && matchesPriority && matchesDependency;
  }

  private filterByTab(tasks: TaskItem[]): TaskItem[] {
    const today = this.due.startOfToday();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    switch (this.listFilter) {
      case 'today':
        return tasks.filter((task) => this.isDueToday(task, today));

      case 'week':
        return tasks.filter((task) => this.isDueWithinWeek(task, today, weekEnd));

      case 'all':
        return tasks;
    }
  }

  private isDueToday(task: TaskItem, today: Date): boolean {
    if (!task.dueAt) {
      return false;
    }

    return this.due.isSameLocalDay(new Date(task.dueAt), today);
  }

  private isDueWithinWeek(task: TaskItem, today: Date, weekEnd: Date): boolean {
    if (!task.dueAt) {
      return false;
    }

    const dueDay = this.due.startOfLocalDay(new Date(task.dueAt));

    return dueDay >= today && dueDay <= weekEnd;
  }

  private isOverdue(task: TaskItem): boolean {
    return !task.done && Boolean(task.dueAt) && this.dueTime(task) < Date.now();
  }

  private sortTasks(tasks: TaskItem[]): TaskItem[] {
    return [...tasks].sort((a, b) => this.compareTasks(a, b));
  }

  private compareTasks(a: TaskItem, b: TaskItem): number {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    const aDue = this.dueTime(a);
    const bDue = this.dueTime(b);

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    return a.title.localeCompare(b.title);
  }

  private dueTime(task: TaskItem): number {
    return task.dueAt ? new Date(task.dueAt).getTime() : Number.POSITIVE_INFINITY;
  }
}