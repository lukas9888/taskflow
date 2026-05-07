import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  DestroyRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TaskItem, TaskPriorityLevel } from '../models/task-item';
import { CategoryService } from '../services/category.service';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';
import { TaskDependenciesComponent } from '../task-dependencies/task-dependencies.component';
import {
  TASK_PRIORITY_OPTIONS,
  priorityIconCssColor,
  priorityIconGlyph,
  taskPriorityFromModel
} from '../task-ux';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-task-detail-pane',
  imports: [
    MatIconModule,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
    TaskDependenciesComponent,
  ],
  templateUrl: './task-detail-pane.component.html',
  styleUrl: './task-detail-pane.component.css'
})
export class TaskDetailPaneComponent implements OnChanges {
  private readonly tasksApi = inject(TaskService);
  private readonly due = inject(DueDatetimeService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly autosaveTrigger$ = new Subject<void>();

    constructor() {
    this.autosaveTrigger$
      .pipe(
        debounceTime(1000),
        tap(() => {
          this.saveState = 'saving';
          this.formError = null;
        }),
        switchMap(() =>
          this.saveCurrentTask().pipe(
            catchError(() => {
              this.saveState = 'error';
              this.formError = 'Could not update task.';
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.saveState = 'saved';
        this.taskUpdated.emit();
      });
  }

  @ViewChild('categoryInputEl') private categoryInputEl?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) task!: TaskItem;
  @Input() allTasks: TaskItem[] = [];
  @Output() readonly taskUpdated = new EventEmitter<void>();
  @Output() readonly taskDeleted = new EventEmitter<void>();
  @Output() readonly dependenciesChanged = new EventEmitter<void>();
  /** Close/dismiss the sheet (clears selection in parent). */
  @Output() readonly closed = new EventEmitter<void>();

  requestClose(): void {
    this.closed.emit();
  }

  title = '';
  dueDate: Date | null = null;
  dueTime: Date | null = null;
  timeMin: Date | null = null;
  priority: TaskPriorityLevel = 'medium';
  /** Selected category (renders as a chip). */
  category = '';
  /** Free text input bound to the autocomplete input. */
  categoryInput = '';
  description = '';

  saving = false;
  deleting = false;
  formError: string | null = null;
  saveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';

  dateError: string | null = null;
  timeError: string | null = null;

  private dueDateInvalid = false;
  private dueTimeInvalid = false;
  private currentTaskId: number | null = null;

  readonly priorityOptions = TASK_PRIORITY_OPTIONS;

  private allCategories: string[] = [];

  priorityLabel(level: TaskPriorityLevel): string {
    switch (level) {
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      default:
        return 'Medium';
    }
  }

  priorityIcon(level: TaskPriorityLevel): string {
    return priorityIconGlyph(level);
  }

  priorityColor(level: TaskPriorityLevel): string {
    return priorityIconCssColor(level);
  }

  /** Autocomplete options: fetched categories filtered by current input, plus current value if custom. */
  get categoryOptions(): string[] {
    // Filter by what the user is typing, not by the selected chip value.
    const raw = (this.categoryInput ?? '').trim();
    const q = raw.toUpperCase();

    const filtered = q
      ? this.allCategories.filter((c) => c.toUpperCase().includes(q))
      : [...this.allCategories];

    return Array.from(new Set(filtered));
  }

  get canCreateCategory(): boolean {
    const q = this.normalizeCategoryOrEmpty(this.categoryInput);
    if (!q) return false;
    return !this.allCategories.some((c) => c.toUpperCase() === q.toUpperCase());
  }

  get createCategoryLabel(): string {
    const q = this.normalizeCategoryOrEmpty(this.categoryInput);
    return q ? `Create "${q}"` : 'Create';
  }

  ngOnChanges(changes: SimpleChanges): void {
  if (!changes['task']) {
    return;
  }

  const openedDifferentTask = this.currentTaskId !== this.task.id;
  this.currentTaskId = this.task.id;

  this.patchFormFromTask();
  this.ensureCategoriesLoaded();

  this.formError = null;
  this.dateError = null;
  this.timeError = null;
  this.saving = false;
  this.deleting = false;
  this.dueDateInvalid = false;
  this.dueTimeInvalid = false;

  if (openedDifferentTask) {
    this.saveState = 'idle';
  }
}

  onDueDateChange(): void {
    this.timeMin = this.due.timeMinForDate(this.dueDate);
  }

  resetForm(): void {
    this.patchFormFromTask();
    this.formError = null;
  }

  onCategoryBlur(): void {
    // Normalize typed text (visual consistency), but don't create/commit.
    this.categoryInput = this.normalizeCategoryOrEmpty(this.categoryInput);
  }

  selectCategory(value: string): void {
    const normalized = this.normalizeCategoryOrEmpty(value);
    this.category = normalized;
    this.categoryInput = '';
    this.onFieldChanged();
    // MatAutocomplete may write the selected option back into the input after handlers run.
    // Clear again in a microtask so the chip visually replaces the text.
    queueMicrotask(() => {
      this.categoryInput = '';
      const el = this.categoryInputEl?.nativeElement;
      if (el) el.value = '';
    });
    if (!normalized) return;

    // Create immediately (idempotent on backend). Also keep local suggestions fresh.
    this.categoriesApi.createCategory(normalized).subscribe({
      next: (name) => {
        const n = this.normalizeCategoryOrEmpty(name);
        if (n && !this.allCategories.includes(n)) {
          this.allCategories = [...this.allCategories, n].sort((a, b) => a.localeCompare(b));
        }
      },
      error: () => {
        // If it fails, we still keep the selected chip; saving the task will try again.
      }
    });
  }

  createCategoryFromInput(): void {
    const q = this.normalizeCategoryOrEmpty(this.categoryInput);
    if (!q) return;
    this.selectCategory(q);
  }

  onCategoryOptionSelected(value: string): void {
    const v = value ?? '';
    const prefix = '__create__:' as const;
    if (v.startsWith(prefix)) {
      this.selectCategory(v.slice(prefix.length));
      return;
    }
    this.selectCategory(v);
  }

  categoryDisplay(): string {
    // Keep the input visually empty after selecting an option.
    return '';
  }

  clearCategory(): void {
    this.category = '';
    this.categoryInput = '';
    this.onFieldChanged();
  }

  save(): void {
    const trimmed = this.title.trim();
    if (trimmed.length < 2) {
      this.formError = 'Enter at least 2 characters.';
      return;
    }
    if (this.dueDate && !this.dueTime) {
      this.formError = 'Select a due time, or clear the due date.';
      return;
    }
    if (!this.dueDate && this.dueTime) {
      this.formError = 'Select a due date, or clear the due time.';
      return;
    }

    this.saving = true;
    this.formError = null;
    const effectiveDate = this.dueDate ?? this.due.startOfToday();
    const effectiveTime = this.dueTime ?? new Date(1970, 0, 1, 0, 0, 0);
    const dueAt = this.due.toIsoOrNull(effectiveDate, effectiveTime);
    const desc = this.description.trim();

    this.tasksApi
      .updateTask(this.task.id, {
        title: trimmed,
        dueAt,
        priority: this.priority,
        category: this.toApiCategoryOrNull(this.category),
        description: desc.length > 0 ? desc : null,
        done: this.task.done
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.taskUpdated.emit();
        },
        error: () => {
          this.saving = false;
          this.formError = 'Could not update task.';
        }
      });
    }

    onFieldChanged(): void {
    this.saveState = 'saving';
    this.formError = null;
    this.autosaveTrigger$.next();
    }

    onDateTimeChanged(field: 'date' | 'time', invalid: boolean): void {
  if (field === 'date') {
    this.dueDateInvalid = invalid;
    this.dateError = invalid ? 'Enter a valid date.' : null;
  } else {
    this.dueTimeInvalid = invalid;
    this.timeError = invalid ? 'Enter a valid time.' : null;
  }

  this.formError = null;

  if (!this.dueDateInvalid && this.dueDate && !this.dueTime) {
    this.timeError = 'Select a valid time.';
  }

  if (!this.dueTimeInvalid && !this.dueDate && this.dueTime) {
    this.dateError = 'Select a valid date.';
  }

  if (this.dateError || this.timeError) {
    this.saveState = 'idle';
    return;
  }

  this.onFieldChanged();
}
    private saveCurrentTask() {
    const trimmed = this.title.trim();

    if (trimmed.length < 2) {
      this.saveState = 'error';
      this.formError = 'Enter at least 2 characters.';
      return EMPTY;
    }

    if (this.dueDateInvalid || this.dueTimeInvalid || this.dateError || this.timeError) {
      this.saveState = 'idle';
      return EMPTY;
    }

    if (this.dueDate && !this.dueTime) {
      this.timeError = 'Select a valid time.';
      this.saveState = 'idle';
      return EMPTY;
    }

    if (!this.dueDate && this.dueTime) {
      this.dateError = 'Select a valid date.';
      this.saveState = 'idle';
      return EMPTY;
    }

    const effectiveDate = this.dueDate ?? this.due.startOfToday();
    const effectiveTime = this.dueTime ?? new Date(1970, 0, 1, 0, 0, 0);
    const dueAt = this.due.toIsoOrNull(effectiveDate, effectiveTime);
    const desc = this.description.trim();

    return this.tasksApi.updateTask(this.task.id, {
      title: trimmed,
      dueAt,
      priority: this.priority,
      category: this.toApiCategoryOrNull(this.category),
      description: desc.length > 0 ? desc : null,
      done: this.task.done
    });
  }

  deleteTask(): void {
    if (this.deleting) {
      return;
    }
    this.deleting = true;
    this.formError = null;
    this.tasksApi.deleteTask(this.task.id).subscribe({
      next: () => {
        this.deleting = false;
        this.taskDeleted.emit();
      },
      error: () => {
        this.deleting = false;
        this.formError = 'Could not delete task.';
      }
    });
  }

  private patchFormFromTask(): void {
    if (!this.task) {
      return;
    }
    this.title = this.task.title;
    const parts = this.due.fromIso(this.task.dueAt);
    this.dueDate = parts.date;
    this.dueTime = parts.time;
    this.timeMin = this.due.timeMinForDate(this.dueDate);
    this.priority = taskPriorityFromModel(this.task);
    this.category = this.normalizeCategoryOrEmpty(this.task.category ?? '');
    this.categoryInput = '';
    this.description = this.task.description ?? '';
  }

  private ensureCategoriesLoaded(): void {
    if (this.allCategories.length > 0) return;
    this.categoriesApi.getCategories().subscribe({
      next: (cats) => {
        // Normalize to the same format as the backend/UI.
        const normalized = cats.map((c) => this.normalizeCategoryOrEmpty(c)).filter(Boolean);
        this.allCategories = Array.from(new Set(normalized));
      },
      error: () => {
        // Autocomplete still works with free text; just no suggestions.
        this.allCategories = [];
      }
    });
  }

  // Used by template to construct the "Create" option label/value.
  normalizeCategoryOrEmpty(c: string | null | undefined): string {
    const t = (c ?? '').trim().toUpperCase();
    if (!t) return '';
    return t.length > 64 ? t.slice(0, 64) : t;
  }

  private toApiCategoryOrNull(c: string | null | undefined): string | null {
    const t = this.normalizeCategoryOrEmpty(c);
    return t.length > 0 ? t : null;
  }

}
