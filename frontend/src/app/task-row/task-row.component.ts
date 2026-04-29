import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../models/task-item';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-row',
  imports: [FormsModule, DatePipe],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css'
})
export class TaskRowComponent {
  private readonly tasks = inject(TaskService);

  @Input({ required: true }) task!: TaskItem;
  @Output() deleted = new EventEmitter<number>();
  @Output() updated = new EventEmitter<void>();

  isEditing = false;
  editTitle = '';
  editDueAt = '';
  minDueAt = this.toDateTimeLocalValue(new Date());
  saving = false;
  editError: string | null = null;

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.task.title;
    this.editDueAt = this.toDateTimeLocalValue(this.task.dueAt);
    this.editError = null;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editTitle = '';
    this.editDueAt = '';
    this.editError = null;
    this.saving = false;
  }

  saveEdit(): void {
    const trimmed = this.editTitle.trim();

    if (trimmed.length < 2) {
      this.editError = 'Enter at least 2 characters.';
      return;
    }

    this.minDueAt = this.toDateTimeLocalValue(new Date());

    if (this.editDueAt && new Date(this.editDueAt) < new Date()) {
      this.editError = 'Due date and time cannot be in the past.';
      return;
    }

    this.saving = true;
    this.editError = null;

    const dueAt = this.editDueAt ? new Date(this.editDueAt).toISOString() : null;

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

  private toDateTimeLocalValue(value: string | Date | null): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return localDate.toISOString().slice(0, 16);
}

  delete(): void {
    this.tasks.deleteTask(this.task.id).subscribe({
      next: () => this.deleted.emit(this.task.id),
    });
  }
}