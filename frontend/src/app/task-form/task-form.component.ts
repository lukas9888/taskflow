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
  submitting = false;
  submitError: string | null = null;

  constructor(private readonly taskService: TaskService) {}

  submit(): void {
    const trimmed = this.title.trim();
    if (trimmed.length < 2) return;

    this.submitting = true;
    this.submitError = null;
    this.taskService.createTask(trimmed).subscribe({
      next: () => {
        this.title = '';
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
