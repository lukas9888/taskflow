import { TaskItem, TaskPriorityLevel } from './models/task-item';

/** Select options — aligned with Stitch-style chips. */
export const TASK_CATEGORY_OPTIONS = [
  'DEVELOPMENT',
  'TECHNICAL',
  'API',
  'FINANCE',
  'DESIGN',
  'GENERAL'
] as const;

export type TaskCategoryOption = (typeof TASK_CATEGORY_OPTIONS)[number];

/** Priority values for selects (API order). */
export const TASK_PRIORITY_OPTIONS: readonly TaskPriorityLevel[] = ['high', 'medium', 'low'];

/** Material Icons ligature: 3 bars, 2-bar handle, single bar (low / medium / high). */
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

/** Same palette as the previous custom bar indicator. */
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

/** Normalize API / legacy values for list row display. */
export function taskPriorityFromModel(task: TaskItem): TaskPriorityLevel {
  const p = task.priority;
  if (p === 'high' || p === 'medium' || p === 'low') {
    return p;
  }
  return 'medium';
}

export function taskCategoryFromModel(task: TaskItem): string {
  return task.category?.trim() || 'GENERAL';
}
