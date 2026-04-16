export interface Section {
  level: 1 | 2 | 3;
  heading: string;
  content: string[];
}

export interface DailyLog {
  date: string;
  title?: string;
  tags: string[];
  sections: Section[];
}
