import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TaskItem, TaskPriorityLevel } from '../models/task-item';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';
import { TaskDependenciesComponent } from '../task-dependencies/task-dependencies.component';
import {
  TASK_CATEGORY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  priorityIconCssColor,
  priorityIconGlyph,
  taskPriorityFromModel
} from '../task-ux';

@Component({
  selector: 'app-task-detail-pane',
  imports: [
    MatIconModule,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
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
  category = 'GENERAL';
  description = '';

  saving = false;
  deleting = false;
  formError: string | null = null;

  readonly priorityOptions = TASK_PRIORITY_OPTIONS;

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

  /** Known categories plus current value if it is custom. */
  get categorySelectOptions(): string[] {
    const set = new Set<string>([...TASK_CATEGORY_OPTIONS]);
    const raw = this.category?.trim().toUpperCase();
    if (raw) {
      set.add(raw);
    }
    return Array.from(set);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['task']) {
      return;
    }
    this.patchFormFromTask();
    this.formError = null;
    this.saving = false;
    this.deleting = false;
  }

  onDueDateChange(): void {
    this.timeMin = this.due.timeMinForDate(this.dueDate);
  }

  resetForm(): void {
    this.patchFormFromTask();
    this.formError = null;
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
        category: this.category,
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
    this.category = (this.task.category ?? 'GENERAL').trim().toUpperCase() || 'GENERAL';
    this.description = this.task.description ?? '';
  }

}
