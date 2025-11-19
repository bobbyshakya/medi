// schedule.ts
export type LocationId = "png" | "slb" | "vut" | "fji"

export type ScheduleLocation = {
  id: LocationId
  label: string
  country: string
  city: string
  dates: string[]
  times: string[]
  venues: string[]
  feeLabel: string
  localContact?: string
  availableSlots?: TimeSlot[][]
}

export type TimeSlot = {
  time: string
  displayTime: string
  isAvailable: boolean
}

export const schedule: ScheduleLocation[] = [
  {
    id: "png",
    label: "Papua New Guinea ",
    country: "Papua New Guinea",
    city: "Port Moresby",
    // NOTE: This array includes the past date (2025-11-18)
    dates: ["2025-11-18", "2025-11-19"],
    times: ["2 PM to 6 PM", "9 AM to 6 PM"],
    venues: ["Hotel Holiday Inn", "Hotel Holiday Inn"],
    feeLabel: "100 PGK ",
    localContact: "Shirley Waira: 74376546",
    availableSlots: [
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: false },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: false },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: false },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ],
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: true },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: false },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ]
    ]
  },
  {
    id: "slb",
    label: "Solomon Islands ",
    country: "Solomon Islands",
    city: "Honiara",
    dates: ["2025-11-20", "2025-11-21"],
    times: ["2 PM to 6 PM", "9 AM to 6 PM"],
    venues: ["Hotel Grace", "Hotel Grace"],
    feeLabel: "200 SBD ",
    localContact: "Freda Sofu: 7618955",
    availableSlots: [
      [
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ],
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: false },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ]
    ]
  },
  {
    id: "vut",
    label: "Vanuatu ",
    country: "Vanuatu",
    city: "Port Vila",
    dates: ["2025-11-23", "2025-11-24"],
    times: ["9 AM to 6 PM", "9 AM to 1 PM"],
    venues: ["Hotel Golden Port", "Hotel Golden Port"],
    feeLabel: "1500 Vatu ",
    localContact: "Mary Semeno: 7627430 / 5213197",
    availableSlots: [
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: true },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: false },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ],
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: true },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "12:00", displayTime: "12:00 am to 1:00 PM", isAvailable: true }
      ]
    ]
  },
  {
    id: "fji",
    label: "Fiji ",
    country: "Fiji",
    city: "Suva & Lautoka",
    dates: ["2025-11-25", "2025-11-26"],
    times: ["9 AM to 6 PM", "9 AM to 6 PM"],
    venues: ["Hotel Novotel, Lami", "Hotel Novotel, Namaka"],
    feeLabel: "50 FJD ",
    localContact: "Suva: Reshmi Kumar (9470588), Lautoka: Ashlin Chandra (9470527)",
    availableSlots: [
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: true },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: false },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ],
      [
        { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
        { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: false },
        { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
        { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
        { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
        { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
        { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
      ]
    ]
  },
]

// Default time slots structure
export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { time: "09:00", displayTime: "9:00 AM to 10:00 AM", isAvailable: true },
  { time: "10:00", displayTime: "10:00 AM to 11:00 AM", isAvailable: true },
  { time: "11:00", displayTime: "11:00 AM to 12:00 PM", isAvailable: true },
  { time: "14:00", displayTime: "2:00 PM to 3:00 PM", isAvailable: true },
  { time: "15:00", displayTime: "3:00 PM to 4:00 PM", isAvailable: true },
  { time: "16:00", displayTime: "4:00 PM to 5:00 PM", isAvailable: true },
  { time: "17:00", displayTime: "5:00 PM to 6:00 PM", isAvailable: true }
]

// --- Core Dynamic Filtering Logic (Used ONLY for the Form) ---

/**
 * Filters the location data to include only dates that are strictly in the future.
 * This function is used to prepare data for the form's date selector.
 * @param location The ScheduleLocation object to filter.
 * @returns A new ScheduleLocation object with only future dates and corresponding data.
 */
function getFutureDatesForLocation(location: ScheduleLocation): ScheduleLocation {
  // 1. Determine "Tomorrow" for comparison purposes (Start of the next day)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); 
  tomorrow.setHours(0, 0, 0, 0); 

  const futureDates: string[] = [];
  const futureTimes: string[] = [];
  const futureVenues: string[] = [];
  const futureSlots: TimeSlot[][] = [];

  location.dates.forEach((dateString, index) => {
    // 2. Prepare scheduled date for comparison (Start of that day)
    const scheduledDate = new Date(dateString + "T00:00:00");
    scheduledDate.setHours(0, 0, 0, 0); 

    // 3. Filter: Only keep dates that are tomorrow or later.
    if (scheduledDate >= tomorrow) {
      futureDates.push(dateString);
      if (location.times[index]) futureTimes.push(location.times[index]);
      if (location.venues[index]) futureVenues.push(location.venues[index]);
      if (location.availableSlots && location.availableSlots[index]) {
        futureSlots.push(location.availableSlots[index]);
      }
    }
  });

  return {
    ...location,
    dates: futureDates,
    times: futureTimes,
    venues: futureVenues,
    availableSlots: futureSlots,
  };
}

// --- Utility Functions ---

export function formatDateFriendly(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export function formatTimeFriendly(t24: string) {
  const [h, m] = t24.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

/**
 * Formats schedule details for the left-side display.
 * This function uses the original, UNFILTERED location data 
 * to show the full schedule content, including past dates.
 */
export function formatScheduleDetails(location: ScheduleLocation): string[] {
  // IMPORTANT: We use the original 'location.dates' array here, not the filtered one.
  return location.dates.map((date, index) => {
    const formattedDate = formatDateFriendly(date)
    const time = location.times[index] || ""
    const venue = location.venues[index] || ""
    
    if (time || venue) {
        if (time && venue) return `${formattedDate}, ${time}, ${venue}`
        if (time) return `${formattedDate}, ${time}`
        if (venue) return `${formattedDate}, ${venue}`
    }
    return formattedDate
  })
}

export function getFlagEmoji(locationId: LocationId): string {
  const flags: Record<LocationId, string> = {
    png: "🇵🇬",
    slb: "🇸🇧",
    vut: "🇻🇺",
    fji: "🇫🇯",
  }
  return flags[locationId] || "🏳️"
}

/**
 * Returns the ScheduleLocation data, filtered to only include dates that 
 * are strictly in the future (tomorrow onwards). This is used EXCLUSIVELY 
 * to populate the form's date dropdown.
 */
export function getLocationById(id: LocationId): ScheduleLocation | undefined {
  const location = schedule.find((loc) => loc.id === id);
  if (location) {
    // Apply the future date filter before returning the data for the form
    const filteredLocation = getFutureDatesForLocation(location);
    // If filtering results in no dates, treat it as if the location doesn't exist for the form context
    if (filteredLocation.dates.length === 0) return undefined;
    return filteredLocation;
  }
  return undefined;
}

/**
 * Returns only the LocationIds that still have at least one future date available.
 * This is used to populate the Country dropdown in the form.
 */
export function getAllLocationIds(): LocationId[] {
  return schedule
    .filter(loc => {
      // Check if the location has any future dates after filtering
      const filteredLoc = getFutureDatesForLocation(loc);
      return filteredLoc.dates.length > 0;
    })
    .map((loc) => loc.id);
}

/**
 * Returns available time slots for a specific date index within the filtered location.
 * This filters for slots where isAvailable is true, implementing the "hide unavailable option" logic.
 */
export function getTimeSlotsForDate(location: ScheduleLocation, dateIndex: number): TimeSlot[] {
  if (location.availableSlots && location.availableSlots[dateIndex]) {
    // Filter to only include available slots (isAvailable: true)
    return location.availableSlots[dateIndex].filter(slot => slot.isAvailable)
  }
  return DEFAULT_TIME_SLOTS.filter(slot => slot.isAvailable)
}

export function isTimeSlotAvailable(location: ScheduleLocation, dateIndex: number, time: string): boolean {
  const slots = getTimeSlotsForDate(location, dateIndex)
  return slots.some(slot => slot.time === time && slot.isAvailable)
}