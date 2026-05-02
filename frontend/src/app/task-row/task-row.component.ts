import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TaskItem } from '../models/task-item';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-row',
  imports: [
    FormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatTimepickerModule
  ],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css'
})
export class TaskRowComponent {
  private readonly tasks = inject(TaskService);
  private readonly due = inject(DueDatetimeService);

  @Input({ required: true }) task!: TaskItem;
  @Output() deleted = new EventEmitter<number>();
  @Output() updated = new EventEmitter<void>();

  isEditing = false;
  editTitle = '';
  editDueDate: Date | null = null;
  editDueTime: Date | null = null;
  editTimeMin: Date | null = null;

  readonly minDate = this.due.startOfToday();

  saving = false;
  editError: string | null = null;

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.task.title;
    const parts = this.due.fromIso(this.task.dueAt);
    this.editDueDate = parts.date;
    this.editDueTime = parts.time;
    this.editError = null;
    this.refreshEditTimeMin();
  }

  onEditDueDateChange(): void {
    this.refreshEditTimeMin();
  }

  private refreshEditTimeMin(): void {
    this.editTimeMin = this.due.timeMinForDate(this.editDueDate);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editTitle = '';
    this.editDueDate = null;
    this.editDueTime = null;
    this.editError = null;
    this.saving = false;
  }

  saveEdit(): void {
    const trimmed = this.editTitle.trim();

    if (trimmed.length < 2) {
      this.editError = 'Enter at least 2 characters.';
      return;
    }

    if (this.editDueDate && !this.editDueTime) {
      this.editError = 'Select a due time, or clear the due date.';
      return;
    }
    if (!this.editDueDate && this.editDueTime) {
      this.editError = 'Select a due date, or clear the due time.';
      return;
    }

    const combined = this.due.combine(this.editDueDate, this.editDueTime);
    if (this.due.isBeforeNow(combined)) {
      this.editError = 'Due date and time cannot be in the past.';
      return;
    }

    this.saving = true;
    this.editError = null;

    const dueAt = this.due.toIsoOrNull(this.editDueDate, this.editDueTime);

    this.tasks.updateTask(this.task.id, trimmed, dueAt).subscribe({
      next: () => {
        this.saving = false;
        this.isEditing = false;
        this.updated.emit();
      },
      error: () => {
        this.saving = false;
        this.editError = 'Could not update task.';
      }
    });
  }

  delete(): void {
    this.tasks.deleteTask(this.task.id).subscribe({
      next: () => this.deleted.emit(this.task.id)
    });
  }
}
