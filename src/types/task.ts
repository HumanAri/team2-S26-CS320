export interface Category {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export interface Task {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  recurringDays: string[];
  completed?: boolean;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  tasksCompleted: number;
  totalTasks: number;
}