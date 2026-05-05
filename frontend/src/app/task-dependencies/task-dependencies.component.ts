import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { Subject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) task!: TaskItem;
  @Input({ required: true }) allTasks: TaskItem[] = [];
  @Output() readonly dependenciesChanged = new EventEmitter<void>();

  dependencies: TaskDependency[] = [];
  selectedDependsOnId: number | null = null;
  loadError: string | null = null;
  addError: string | null = null;
  adding = false;

  searchText = '';

  private readonly loadTrigger$ = new Subject<{ taskId: number; force: boolean }>();

  constructor() {
    this.loadTrigger$.pipe(
      switchMap(({ taskId, force }) =>
        this.depService.loadAllForUser(force).pipe(
          switchMap(() => this.depService.getForTask(taskId)),
          catchError(() => {
            this.loadError = 'Could not load dependencies.';
            return of([] as TaskDependency[]);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(deps => {
      this.dependencies = deps;
    });
  }

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

  load(force = false): void {
    this.loadError = null;
    this.loadTrigger$.next({ taskId: this.task.id, force });
  }

  add(): void {
    if (this.selectedDependsOnId == null) return;
    this.adding = true;
    this.addError = null;
    this.depService.add(this.task.id, this.selectedDependsOnId).pipe(
      switchMap(() => this.depService.loadAllForUser(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.adding = false;
        this.selectedDependsOnId = null;
        this.searchText = '';
        this.dependenciesChanged.emit();
      },
      error: () => {
        this.adding = false;
        this.addError = 'Could not add dependency.';
      }
    });
  }

  remove(dependsOnId: number): void {
    this.depService.remove(this.task.id, dependsOnId).pipe(
      switchMap(() => this.depService.loadAllForUser(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.dependenciesChanged.emit();
      },
      error: () => (this.loadError = 'Could not remove dependency.')
    });
  }
}