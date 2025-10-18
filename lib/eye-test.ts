// lib/schedule.ts

export interface ScheduleItem {
  id: string;
  label: string;
  city: string;
  date: string;
  time: string;
  venue: string;
  feeLabel: string;
  localContact?: string;
  doctor?: string;
  specialization?: string;
}

export const schedule: ScheduleItem[] = [
  {
    id: "suva-1",
    label: "Eye Test Camp - Suva",
    city: "Suva",
    date: "October 27, 2025",
    time: "9:00 AM - 5:00 PM",
    venue: "Grand Pacific Hotel, Suva",
    feeLabel: "50 FJD",
    localContact: "+679 123 4567",
    doctor: "Dr. Rajesh Kumar",
    specialization: "Senior Ophthalmologist"
  },
  {
    id: "suva-2",
    label: "Eye Test Camp - Suva",
    city: "Suva",
    date: "October 28, 2025",
    time: "9:00 AM - 5:00 PM",
    venue: "Grand Pacific Hotel, Suva",
    feeLabel: "50 FJD",
    localContact: "+679 123 4567",
    doctor: "Dr. Rajesh Kumar",
    specialization: "Senior Ophthalmologist"
  },
  {
    id: "lautoka",
    label: "Eye Test Camp - Lautoka",
    city: "Lautoka",
    date: "October 29, 2025",
    time: "9:00 AM - 5:00 PM",
    venue: "Lautoka Medical Center",
    feeLabel: "50 FJD",
    localContact: "+679 234 5678",
    doctor: "Dr. Rajesh Kumar",
    specialization: "Senior Ophthalmologist"
  },
  {
    id: "namaka",
    label: "Eye Test Camp - Namaka",
    city: "Namaka",
    date: "October 30, 2025",
    time: "9:00 AM - 4:00 PM",
    venue: "Namaka Community Hall",
    feeLabel: "50 FJD",
    localContact: "+679 345 6789",
    doctor: "Dr. Rajesh Kumar",
    specialization: "Senior Ophthalmologist"
  }
];

export function formatDateFriendly(date: string): string {
  return date;
}

export function formatScheduleDetails(loc: ScheduleItem): string[] {
  return [
    `📅 ${loc.date}`,
    `⏰ ${loc.time}`,
    `📍 ${loc.venue}`,
    `👨‍⚕️ ${loc.doctor} - ${loc.specialization}`
  ];
}