import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  @Output() readonly created = new EventEmitter<void>();

  title = '';
  dueAt = '';
  minDueAt = this.toDateTimeLocalValue(new Date());
  submitting = false;
  submitError: string | null = null;

  constructor(private readonly taskService: TaskService) {}

  
  submit(): void {
    const trimmed = this.title.trim();

    if (trimmed.length < 2) return;

    this.minDueAt = this.toDateTimeLocalValue(new Date());

    if (this.dueAt && new Date(this.dueAt) < new Date()) {
      this.submitError = 'Due date and time cannot be in the past.';
      return;
    }

    const dueAt = this.dueAt ? new Date(this.dueAt).toISOString() : null;

    this.submitting = true;
    this.submitError = null;
    this.taskService.createTask(trimmed, dueAt).subscribe({
      next: () => {
        this.title = '';
        this.dueAt = '';
        this.submitting = false;
        this.created.emit();
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Could not save task. Check API and database.';
      }
    });
  }

  private toDateTimeLocalValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
  }
}
