import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TaskItem } from '../models/task-item';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-row',
  imports: [],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css'
})
export class TaskRowComponent {
  private readonly tasks = inject(TaskService);
  @Input({ required: true }) task!: TaskItem;
  /** Parent can listen: (deleted)="reload()" or remove from array */
  @Output() deleted = new EventEmitter<number>();
  delete(): void {
    this.tasks.deleteTask(this.task.id).subscribe({
      next: () => this.deleted.emit(this.task.id),
    });
  }
}