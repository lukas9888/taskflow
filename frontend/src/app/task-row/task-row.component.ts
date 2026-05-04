import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import {
  MatListItem,
  MatListItemIcon,
  MatListItemMeta,
  MatListItemTitle,
} from '@angular/material/list';
import { TaskItem } from '../models/task-item';
import {
  priorityIconCssColor,
  priorityIconGlyph,
  taskCategoryFromModel,
  taskPriorityFromModel,
} from '../task-ux';

@Component({
  selector: 'app-task-row',
  imports: [
    DatePipe,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatListItem,
    MatListItemIcon,
    MatListItemMeta,
    MatListItemTitle,
  ],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css',
})
export class TaskRowComponent {
  @Input({ required: true }) task!: TaskItem;
  @Input() selected = false;
  @Input() completed = false;
  /** When false, no bottom divider (e.g. last row in the list). */
  @Input() showDivider = true;
  @Output() readonly completedChange = new EventEmitter<boolean>();
  @Output() readonly select = new EventEmitter<void>();

  get categoryLabel(): string {
    return taskCategoryFromModel(this.task);
  }

  /** Single read of model priority for the row meta icon (used once via `@let` in the template). */
  priorityMarker(): { icon: string; color: string } {
    const level = taskPriorityFromModel(this.task);
    return { icon: priorityIconGlyph(level), color: priorityIconCssColor(level) };
  }

  onRowActivate(event: MouseEvent): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest('button, a, input, mat-checkbox')) {
      return;
    }
    this.select.emit();
  }
}
