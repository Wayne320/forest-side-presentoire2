import { ScheduleData, Day } from './types';

export const LOCAL_STORAGE_KEY = 'forestSideScheduleData';

const initialLocations = [
  "Ian Palach Sud A",
  "Ian Palach Sud B",
  "La Foire Forest Side",
  "Hotel de Ville Curepipe",
  "Kolez Royal",
  "Winner's FS"
];

const initialTimeSlots = [
  "07h00-08h30",
  "09h30-11h00",
  "12h00-14h00",
  "14h00-16h00",
  "16h00-18h00"
];

const initialDays: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function initializeSchedule(locations: string[], timeSlots: string[], days: Day[]) {
  const schedule: ScheduleData['schedule'] = {};
  locations.forEach(location => {
    schedule[location] = {};
    timeSlots.forEach(timeSlot => {
      schedule[location][timeSlot] = {} as Record<Day, string[]>;
      days.forEach(day => {
        schedule[location][timeSlot][day] = [];
      });
    });
  });
  return schedule;
}

export const INITIAL_SCHEDULE_DATA: ScheduleData = {
  locations: initialLocations,
  timeSlots: initialTimeSlots,
  days: initialDays,
  schedule: initializeSchedule(initialLocations, initialTimeSlots, initialDays)
};
