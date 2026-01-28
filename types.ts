
export enum TaskCategory {
  INTERNSHIP = '实习',
  ACADEMIC = '学术/论文',
  SKILL = '技能提升',
  FINANCE = '投资理财',
  PERSONAL = '个人生活'
}

export enum TaskStatus {
  TODO = '待办',
  IN_PROGRESS = '进行中',
  COMPLETED = '已完成'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  deadline?: string;
  progress: number; // 0 to 100 for progress tasks
  status: TaskStatus;
  isRecurring: boolean;
  priority: 'High' | 'Medium' | 'Low';
  subTasks: SubTask[];
  taskType: 'progress' | 'habit';
  checkInDates?: string[]; // ISO strings for habit tracking
}

export interface AISupervisionFeedback {
  summary: string;
  warnings: string[];
  tips: string[];
  adjustedSchedule?: string;
}
