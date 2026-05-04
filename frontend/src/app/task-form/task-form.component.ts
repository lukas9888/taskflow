import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  private readonly taskService = inject(TaskService);

  @Output() readonly created = new EventEmitter<void>();

  title = '';

  submitting = false;
  submitError: string | null = null;

  submit(): void {
    const trimmed = this.title.trim();

    if (trimmed.length < 2) {
      return;
    }

    this.submitting = true;
    this.submitError = null;
    this.taskService.createTask(trimmed, null).subscribe({
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
