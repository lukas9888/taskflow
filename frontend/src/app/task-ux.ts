import { TaskItem, TaskPriorityLevel } from './models/task-item';

export const TASK_PRIORITY_OPTIONS: readonly TaskPriorityLevel[] = ['high', 'medium', 'low'];

export function priorityIconGlyph(level: TaskPriorityLevel): string {
  switch (level) {
    case 'high':
      return 'menu';
    case 'medium':
      return 'drag_handle';
    case 'low':
      return 'remove';
  }
}

export function priorityIconCssColor(level: TaskPriorityLevel): string {
  switch (level) {
    case 'high':
      return 'var(--mat-sys-error)';
    case 'medium':
      return '#f5a524';
    case 'low':
      return '#2563eb';
  }
}

export function taskPriorityFromModel(task: TaskItem): TaskPriorityLevel {
  const p = task.priority;
  if (p === 'high' || p === 'medium' || p === 'low') {
    return p;
  }
  return 'medium';
}

export function taskCategoryFromModel(task: TaskItem): string {
  return task.category?.trim() || '';
}
