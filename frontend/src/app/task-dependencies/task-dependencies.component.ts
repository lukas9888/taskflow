import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { TaskItem } from '../models/task-item';
import { TaskDependency } from '../models/task-dependency';
import { DependencyService } from '../services/dependency.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-task-dependencies',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatAutocompleteModule,
  ],
  templateUrl: './task-dependencies.component.html',
  styleUrl: './task-dependencies.component.css'
})
export class TaskDependenciesComponent implements OnChanges {
  private readonly depService = inject(DependencyService);

  @Input({ required: true }) task!: TaskItem;
  @Input({ required: true }) allTasks: TaskItem[] = [];
  @Output() readonly dependenciesChanged = new EventEmitter<void>();

  dependencies: TaskDependency[] = [];
  selectedDependsOnId: number | null = null;
  loadError: string | null = null;
  addError: string | null = null;
  adding = false;

  searchText = '';

  get filteredTasks(): TaskItem[] {
    const q = this.searchText.toLowerCase();
    const linked = new Set(this.dependencies.map(d => d.dependsOn));
    return this.allTasks.filter(
      t => t.id !== this.task.id &&
           !linked.has(t.id) &&
           t.title.toLowerCase().includes(q)
    );
  }

  selectTask(task: TaskItem): void {
    this.selectedDependsOnId = task.id;
    this.searchText = task.title;
  }

  onSearchTextChange(): void {
    this.selectedDependsOnId = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task']) {
      this.load();
    }
  }

  load(): void {
    this.loadError = null;
    this.depService.getAll(this.task.id).subscribe({
      next: deps => (this.dependencies = deps),
      error: () => (this.loadError = 'Could not load dependencies.')
    });
  }

  add(): void {
    if (this.selectedDependsOnId == null) return;
    this.adding = true;
    this.addError = null;
    this.depService.add(this.task.id, this.selectedDependsOnId).subscribe({
      next: () => {
        this.adding = false;
        this.selectedDependsOnId = null;
        this.searchText = '';
        this.load();
        this.dependenciesChanged.emit();
      },
      error: () => {
        this.adding = false;
        this.addError = 'Could not add dependency.';
      }
    });
  }

  remove(dependsOnId: number): void {
    this.depService.remove(this.task.id, dependsOnId).subscribe({
      next: () => { this.load(); this.dependenciesChanged.emit(); },
      error: () => (this.loadError = 'Could not remove dependency.')
    });
  }
}