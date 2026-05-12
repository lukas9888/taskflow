import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../services/task.service';
import { MatButtonModule } from '@angular/material/button';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  private readonly taskService = inject(TaskService);

  @ViewChild('composerInput') composerInput!: ElementRef<HTMLInputElement>;
  @Output() readonly created = new EventEmitter<any>();
  @Output() readonly openDetail = new EventEmitter<string>();
  @Output() readonly focused = new EventEmitter<void>();

  title = '';

  submitting = false;
  submitError: string | null = null;

  submit(form: NgForm): void {
    const trimmed = this.title.trim();

    if (trimmed.length < 2) {
      return;
    }

    this.submitting = true;
    this.submitError = null;
    const today = new Date();
    const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 45, 0).toISOString();
    this.taskService.createTask(trimmed, todayIso).subscribe({
      next: (created) => {
        this.title = '';
        this.submitting = false;
        form.resetForm();
        setTimeout(() => this.composerInput.nativeElement.focus(), 150);
        this.created.emit(created);
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Could not save task. Check API and database.';
      }
    });
  }

  openWithDetails(form: NgForm): void {
    const trimmed = this.title.trim();
    this.openDetail.emit(trimmed);
    this.title = '';
    form.resetForm();
  }
}