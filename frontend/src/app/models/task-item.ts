export type TaskPriorityLevel = 'high' | 'medium' | 'low';

export interface TaskItem {
  id: number;
  title: string;
  createdAt: string;
  dueAt: string | null;
  priority: TaskPriorityLevel;
  category: string;
  description: string | null;
}
