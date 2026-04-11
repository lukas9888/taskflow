import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../models/task-item';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-row',
  imports: [FormsModule],
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
  saving = false;
  editError: string | null = null;

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.task.title;
    this.editError = null;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editTitle = '';
    this.editError = null;
    this.saving = false;
  }

  saveEdit(): void {
    const trimmed = this.editTitle.trim();

    if (trimmed.length < 2) {
      this.editError = 'Enter at least 2 characters.';
      return;
    }

    this.saving = true;
    this.editError = null;

    this.tasks.updateTask(this.task.id, trimmed).subscribe({
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
      next: () => this.deleted.emit(this.task.id),
    });
  }
}