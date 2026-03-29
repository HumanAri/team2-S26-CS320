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
  date: string;
  startTime: string;
  endTime: string;
  recurringDays: string[];
  completed?: boolean;
}

export interface CalendarTask {
  id: string;
  name: string;
  category: Category;
  day: number;
  startHour: number;
  duration: number;
  completed?: boolean;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  tasksCompleted: number;
  totalTasks: number;
}