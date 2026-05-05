export interface TaskDependency {
  taskId: number;
  dependsOn: number;
  dependsOnTitle: string;
}