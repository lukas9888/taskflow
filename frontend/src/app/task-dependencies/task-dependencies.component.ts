import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
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
import { catchError, switchMap, tap } from 'rxjs/operators';
import { TaskItem } from '../models/task-item';
import { TaskDependency } from '../models/task-dependency';
import { DependencyService } from '../services/dependency.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

export type DependencyViewTab = 'all' | 'blockedBy' | 'blocks';

@Component({
  selector: 'app-task-dependencies',
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
  styleUrl: './task-dependencies.component.css',
})
export class TaskDependenciesComponent implements OnChanges {
  private readonly depService = inject(DependencyService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) task!: TaskItem;
  @Input({ required: true }) allTasks: TaskItem[] = [];
  @Output() readonly saveStateChanged = new EventEmitter<'saving' | 'saved' | 'error'>();

  blockedByDeps: TaskDependency[] = [];
  blocksDeps: TaskDependency[] = [];

  viewTab: DependencyViewTab = 'all';
  selectedOtherTaskId: number | null = null;
  loadError: string | null = null;
  addError: string | null = null;
  adding = false;

  searchText = '';

  private readonly loadTrigger$ = new Subject<number>();

  constructor() {
    this.loadTrigger$
      .pipe(
        switchMap((taskId) =>
          this.depService.getAllForUser().pipe(
            catchError(() => {
              this.loadError = 'Could not load dependencies.';
              return of([] as TaskDependency[]);
            }),
            tap((deps) => this.applyDepsForTask(deps, taskId)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  get canAddDependency(): boolean {
    return this.viewTab === 'blockedBy' || this.viewTab === 'blocks';
  }

  get filteredTasks(): TaskItem[] {
    const q = this.searchText.toLowerCase();
    const alreadyRelated = new Set<number>([
      ...this.blockedByDeps.map((d) => d.blockedBy),
      ...this.blocksDeps.map((d) => d.taskId),
    ]);

    return this.allTasks.filter((t) => {
      if (t.id === this.task.id) return false;
      if (this.viewTab !== 'blockedBy' && this.viewTab !== 'blocks') {
        return false;
      }
      if (alreadyRelated.has(t.id)) return false;
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

  load(): void {
    this.loadError = null;
    this.loadTrigger$.next(this.task.id);
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

    req$
      .pipe(
        switchMap(() => this.depService.getAllForUser()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (deps) => {
          this.applyDepsForTask(deps, this.task.id);
          this.adding = false;
          this.selectedOtherTaskId = null;
          this.searchText = '';
          this.saveStateChanged.emit('saved');
        },
        error: () => {
          this.adding = false;
          this.addError = 'Could not add dependency.';
          this.saveStateChanged.emit('error');
        },
      });
  }

  removeBlockedBy(blockerId: number): void {
    this.loadError = null;
    this.saveStateChanged.emit('saving');
    this.depService
      .remove(this.task.id, blockerId)
      .pipe(
        switchMap(() => this.depService.getAllForUser()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (deps) => {
          this.applyDepsForTask(deps, this.task.id);
          this.saveStateChanged.emit('saved');
        },
        error: () => {
          this.loadError = 'Could not remove dependency.';
          this.saveStateChanged.emit('error');
        },
      });
  }

  removeBlocks(dependentTaskId: number): void {
    this.loadError = null;
    this.saveStateChanged.emit('saving');
    this.depService
      .remove(dependentTaskId, this.task.id)
      .pipe(
        switchMap(() => this.depService.getAllForUser()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (deps) => {
          this.applyDepsForTask(deps, this.task.id);
          this.saveStateChanged.emit('saved');
        },
        error: () => {
          this.loadError = 'Could not remove dependency.';
          this.saveStateChanged.emit('error');
        },
      });
  }

  private applyDepsForTask(deps: TaskDependency[], taskId: number): void {
    this.blockedByDeps = deps.filter((d) => d.taskId === taskId);
    this.blocksDeps = deps.filter((d) => d.blockedBy === taskId);
  }
}
