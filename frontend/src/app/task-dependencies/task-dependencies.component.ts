import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TaskItem } from '../models/task-item';
import { TaskDependency } from '../models/task-dependency';
import { DependencyService } from '../services/dependency.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

export type DependencyViewTab = 'all' | 'blockedBy' | 'blocks';

@Component({
  selector: 'app-task-dependencies',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatAutocompleteModule,
    MatTooltipModule,
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
  @Output() readonly saveStateChanged = new EventEmitter<'saving' | 'saved' | 'error'>();

  blockedByDeps: TaskDependency[] = [];
  blocksDeps: TaskDependency[] = [];

  viewTab: DependencyViewTab = 'all';
  selectedOtherTaskId: number | null = null;
  loadError: string | null = null;
  addError: string | null = null;
  adding = false;

  searchText = '';

  private readonly loadTrigger$ = new Subject<{ taskId: number; force: boolean }>();

  constructor() {
    this.loadTrigger$.pipe(
      switchMap(({ taskId, force }) =>
        this.depService.loadAllForUser(force).pipe(
          map((deps) => ({
            blockedBy: deps.filter((d) => d.taskId === taskId),
            blocks: deps.filter((d) => d.blockedBy === taskId),
          })),
          catchError(() => {
            this.loadError = 'Could not load dependencies.';
            return of({ blockedBy: [] as TaskDependency[], blocks: [] as TaskDependency[] });
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ blockedBy, blocks }) => {
      this.blockedByDeps = blockedBy;
      this.blocksDeps = blocks;
    });
  }

  get canAddDependency(): boolean {
    return this.viewTab === 'blockedBy' || this.viewTab === 'blocks';
  }

  get filteredTasks(): TaskItem[] {
    const q = this.searchText.toLowerCase();
    const blockerIds = new Set(this.blockedByDeps.map((d) => d.blockedBy));
    const dependentIds = new Set(this.blocksDeps.map((d) => d.taskId));

    return this.allTasks.filter((t) => {
      if (t.id === this.task.id) return false;
      if (this.viewTab === 'blockedBy') {
        if (blockerIds.has(t.id)) return false;
      } else if (this.viewTab === 'blocks') {
        if (dependentIds.has(t.id)) return false;
      } else {
        return false;
      }
      return t.title.toLowerCase().includes(q);
    });
  }

  dependentTitle(taskId: number): string {
    return this.allTasks.find((t) => t.id === taskId)?.title ?? `Task #${taskId}`;
  }

  selectTask(task: TaskItem): void {
    this.selectedOtherTaskId = task.id;
    this.searchText = task.title;
  }

  onSearchTextChange(): void {
    this.selectedOtherTaskId = null;
  }

  onViewTabChange(): void {
    this.selectedOtherTaskId = null;
    this.searchText = '';
    this.addError = null;
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
    if (!this.canAddDependency || this.selectedOtherTaskId == null) return;
    this.adding = true;
    this.addError = null;
    this.saveStateChanged.emit('saving');

    const req$ =
      this.viewTab === 'blockedBy'
        ? this.depService.add(this.task.id, this.selectedOtherTaskId)
        : this.depService.add(this.selectedOtherTaskId, this.task.id);

    req$.pipe(
      switchMap(() => this.depService.loadAllForUser(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.adding = false;
        this.selectedOtherTaskId = null;
        this.searchText = '';
        this.dependenciesChanged.emit();
        this.saveStateChanged.emit('saved');
      },
      error: () => {
        this.adding = false;
        this.addError = 'Could not add dependency.';
        this.saveStateChanged.emit('error');
      }
    });
  }

  removeBlockedBy(blockerId: number): void {
    this.saveStateChanged.emit('saving');
    this.depService.remove(this.task.id, blockerId).pipe(
      switchMap(() => this.depService.loadAllForUser(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.dependenciesChanged.emit();
        this.saveStateChanged.emit('saved');
      },
      error: () => {
        this.loadError = 'Could not remove dependency.';
        this.saveStateChanged.emit('error');
      }
    });
  }

  removeBlocks(dependentTaskId: number): void {
    this.saveStateChanged.emit('saving');
    this.depService.remove(dependentTaskId, this.task.id).pipe(
      switchMap(() => this.depService.loadAllForUser(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.dependenciesChanged.emit();
        this.saveStateChanged.emit('saved');
      },
      error: () => {
        this.loadError = 'Could not remove dependency.';
        this.saveStateChanged.emit('error');
      }
    });
  }
}
