export type LocationId = "png" | "slb" | "vut" | "fji-suv" | "fji-ltk"

export type ScheduleLocation = {
  id: LocationId
  label: string
  country: string
  city: string
  dates: string[] // ISO yyyy-mm-dd
  times: string[] // Time ranges like ["9 AM to 6 PM"]
  venues: string[] // Venue names
  feeLabel: string
  localContact?: string
}

export const schedule: ScheduleLocation[] = [
  {
    id: "png",
    label: "Papua New Guinea (Port Moresby)",
    country: "Papua New Guinea",
    city: "Port Moresby",
    dates: ["2025-11-18", "2025-11-19"],
    times: ["9 AM to 6 PM", "9 AM to 6 PM"],
    venues: ["Hotel Crown", "Hotel Crown"],
    feeLabel: "100 PGK / 25 USD",
    localContact: "Shirley Waira: 74376546",
  },
  {
    id: "slb",
    label: "Solomon Islands (Honiara)",
    country: "Solomon Islands",
    city: "Honiara",
    dates: ["2025-11-20", "2025-11-21"],
    times: ["2 PM to 6 PM", "9 AM to 6 PM"],
    venues: ["Hotel Grace", "Hotel Grace"],
    feeLabel: "200 SBD / 25 USD",
    localContact: "Freda Sofu: 7618955",
  },
  {
    id: "vut",
    label: "Vanuatu (Port Vila)",
    country: "Vanuatu",
    city: "Port Vila",
    dates: ["2025-11-23", "2025-11-24"],
    times: ["9 AM to 6 PM", "9 AM to 1 PM"],
    venues: ["Hotel Golden Port", "Hotel Golden Port"],
    feeLabel: "2500 Vatu / 25 USD",
    localContact: "Mary Semeno: 7627430 / 5213197",
  },
  {
    id: "fji-suv",
    label: "Fiji (Suva)",
    country: "Fiji",
    city: "Suva",
    dates: ["2025-11-25"],
    times: ["9 AM to 6 PM"],
    venues: ["Suva Office"],
    feeLabel: "50 FJD / 25 USD",
    localContact: "Reshmi Kumar (Suva): 9470588",
  },
  {
    id: "fji-ltk",
    label: "Fiji (Lautoka)",
    country: "Fiji",
    city: "Lautoka",
    dates: ["2025-11-26"],
    times: ["9 AM to 6 PM"],
    venues: ["Lautoka Office"],
    feeLabel: "50 FJD / 25 USD",
    localContact: "Ashlin Chandra (Lautoka): 9470527",
  },
]

// 30–45 minute appointment slots; adjust as needed.
// Use 24h to avoid locale confusion; UI will display friendly format.
export const TIME_SLOTS_24H = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
] as const

export function formatDateFriendly(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatTimeFriendly(t24: string) {
  const [h, m] = t24.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

// Helper to format date with time and venue
export function formatScheduleDetails(location: ScheduleLocation): string[] {
  return location.dates.map((date, index) => {
    const formattedDate = formatDateFriendly(date)
    const time = location.times[index] || ""
    const venue = location.venues[index] || ""

    if (time && venue) {
      return `${formattedDate}, ${time}, ${venue}`
    } else if (time) {
      return `${formattedDate}, ${time}`
    } else if (venue) {
      return `${formattedDate}, ${venue}`
    }
    return formattedDate
  })
}

// Helper function to map location IDs to flag emojis
export function getFlagEmoji(locationId: LocationId): string {
  const flags: Record<LocationId, string> = {
    "png": "🇵🇬",
    "slb": "🇸🇧", 
    "vut": "🇻🇺",
    "fji-suv": "🇫🇯",
    "fji-ltk": "🇫🇯"
  }
  return flags[locationId] || "🏳️"
}

// Helper to get location by ID
export function getLocationById(id: LocationId): ScheduleLocation | undefined {
  return schedule.find(loc => loc.id === id)
}

// Helper to get all location IDs for form
export function getAllLocationIds(): LocationId[] {
  return schedule.map(loc => loc.id)
}