import { Component, OnInit } from '@angular/core';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskListComponent } from './task-list/task-list.component';
import { TaskService } from './services/task.service';
import { TaskItem } from './models/task-item';

@Component({
  selector: 'app-root',
  imports: [TaskFormComponent, TaskListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  tasks: TaskItem[] = [];
  loadError: string | null = null;

  constructor(private readonly taskService: TaskService) {}

  ngOnInit(): void {
    this.refreshTasks();
  }

  refreshTasks(): void {
    this.loadError = null;
    this.taskService.getTasks().subscribe({
      next: (tasks) => (this.tasks = tasks),
      error: () =>
        (this.loadError =
          'Could not load tasks. Is the API running and is the URL in task.service.ts correct?')
    });
  }
}
