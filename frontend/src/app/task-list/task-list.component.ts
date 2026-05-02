import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TaskRowComponent } from '../task-row/task-row.component';
import { TaskItem } from '../models/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskRowComponent, MatCardModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent {
  @Input() tasks: TaskItem[] = [];
  @Output() taskDeleted = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<void>();

  onRowDeleted(): void {
    this.taskDeleted.emit();
  }

  onRowUpdated(): void {
    this.taskUpdated.emit();
  }
}
