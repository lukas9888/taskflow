import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskListComponent } from '../task-list/task-list.component';
import { TaskItem } from '../models/task-item';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-tasks-page',
  imports: [TaskFormComponent, TaskListComponent, MatCardModule],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.css'
})
export class TasksPageComponent implements OnInit {
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
          'Could not load tasks. Are you logged in, and is the API running?')
    });
  }

}

