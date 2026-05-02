import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { DueDatetimeService } from '../services/due-datetime.service';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-form',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatTimepickerModule
  ],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  private readonly taskService = inject(TaskService);
  private readonly due = inject(DueDatetimeService);

  @Output() readonly created = new EventEmitter<void>();

  title = '';
  dueDate: Date | null = null;
  dueTime: Date | null = null;
  timeMin: Date | null = null;

  readonly minDate = this.due.startOfToday();

  submitting = false;
  submitError: string | null = null;

  constructor() {
    this.refreshTimeMin();
  }

  onDueDateChange(): void {
    this.refreshTimeMin();
  }

  private refreshTimeMin(): void {
    this.timeMin = this.due.timeMinForDate(this.dueDate);
  }

  submit(): void {
    const trimmed = this.title.trim();

    if (trimmed.length < 2) return;

    if (this.dueDate && !this.dueTime) {
      this.submitError = 'Select a due time, or clear the due date.';
      return;
    }
    if (!this.dueDate && this.dueTime) {
      this.submitError = 'Select a due date, or clear the due time.';
      return;
    }

    const combined = this.due.combine(this.dueDate, this.dueTime);
    if (this.due.isBeforeNow(combined)) {
      this.submitError = 'Due date and time cannot be in the past.';
      return;
    }

    const dueAt = this.due.toIsoOrNull(this.dueDate, this.dueTime);

    this.submitting = true;
    this.submitError = null;
    this.taskService.createTask(trimmed, dueAt).subscribe({
      next: () => {
        this.title = '';
        this.dueDate = null;
        this.dueTime = null;
        this.refreshTimeMin();
        this.submitting = false;
        this.created.emit();
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Could not save task. Check API and database.';
      }
    });
  }
}
