import { Component, Input } from '@angular/core';
import { TaskItem } from '../models/task-item';

@Component({
  selector: 'app-task-row',
  imports: [],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css'
})
export class TaskRowComponent {
  @Input({ required: true }) task!: TaskItem;
}
