export interface TaskDependency {
  taskId: number;
  blockedBy: number;
  blockedByTitle: string;
}