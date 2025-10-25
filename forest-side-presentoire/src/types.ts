export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type Schedule = Record<string, Record<string, Record<Day, string[]>>>;

export interface ScheduleData {
  locations: string[];
  timeSlots: string[];
  days: Day[];
  schedule: Schedule;
}

export interface EditingSlot {
  location: string;
  time: string;
  day: Day;
}

export interface EditingNameInfo extends EditingSlot {
  index: number;
}

export type NotificationType = 'success' | 'error' | 'warning';

export interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
}
