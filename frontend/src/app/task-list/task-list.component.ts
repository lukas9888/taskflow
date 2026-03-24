import { Component, Input } from '@angular/core';
import { TaskRowComponent } from '../task-row/task-row.component';
import { TaskItem } from '../models/task-item';

@Component({
  selector: 'app-task-list',
  imports: [TaskRowComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent {
  @Input() tasks: TaskItem[] = [];
}
