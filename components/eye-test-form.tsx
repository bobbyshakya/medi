// registration-form.tsx
"use client"
import { useMemo, useState } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  schedule,
  type LocationId,
  type TimeSlot,
  getFlagEmoji,
  getLocationById,
  getAllLocationIds,
  formatDateFriendly,
  getTimeSlotsForDate,
  getAvailableDatesWithIndex
} from "@/lib/eye-test"

type FormState = {
  name: string
  email: string
  phone: string
  country: LocationId
  date: string
  timeSlot: string
  notes: string
}

type FormErrors = {
  name?: string
  email?: string
  phone?: string
  country?: string
  date?: string
  timeSlot?: string
}

export default function ModernRegistrationForm({ className }: { className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<null | { ok: boolean; msg: string }>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    country: "fji-eye", // Default to Fiji Eye Test
    date: "",
    timeSlot: "",
    notes: "",
  })

  const currentLocation = useMemo(() => getLocationById(form.country), [form.country])

  // Get available dates with their times and venues (only dates with available slots)
  const availableDates = useMemo(() => {
    if (!currentLocation) return []

    return getAvailableDatesWithIndex(currentLocation).map(({ date, index, display }) => ({
      date,
      display,
      time: currentLocation.times[index] || "",
      venue: currentLocation.venues[index] || "",
      dateIndex: index
    }))
  }, [currentLocation])

  // Get selected date details
  const selectedDateDetails = useMemo(() => {
    return availableDates.find(d => d.date === form.date)
  }, [form.date, availableDates])

  // Get available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!form.date || !currentLocation || !selectedDateDetails) return []

    const selectedDateIndex = selectedDateDetails.dateIndex;

    return getTimeSlotsForDate(currentLocation, selectedDateIndex)
  }, [form.date, currentLocation, selectedDateDetails])

  // Get selected time slot details
  const selectedTimeSlotDetails = useMemo(() => {
    return availableTimeSlots.find(t => t.time === form.timeSlot)
  }, [form.timeSlot, availableTimeSlots])

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = "Full name is required"
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (form.phone.trim().length < 6) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!form.date) {
      newErrors.date = "Please select a date"
    }

    if (!form.timeSlot) {
      newErrors.timeSlot = "Please select a time slot"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onChange = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value }

      // Reset dependent fields when parent field changes
      if (key === "country") {
        next.date = "" // Reset date when country changes
        next.timeSlot = "" // Reset time slot when country changes
      } else if (key === "date") {
        next.timeSlot = "" // Reset time slot when date changes
      }

      return next
    })

    // Clear error when user starts typing
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSubmitted(null)

    try {
      const selectedLocation = getLocationById(form.country)

      if (!selectedLocation) {
        throw new Error("Invalid location selected")
      }

      const formData = {
        name: form.name.trim(),
        email: form.email.trim(),
        countryName: selectedLocation.label,
        whatsapp: form.phone.replace(/\D/g, ""),
        message: form.notes.trim(),
        appointmentDate: form.date,
        appointmentTime: selectedTimeSlotDetails?.displayTime || form.timeSlot,
        appointmentVenue: selectedDateDetails?.venue || "",
        appointmentLocation: selectedLocation.label,
        serviceType: "Eye Test",
      }

      const res = await fetch("/api/eye-test", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      })

      const contentType = res.headers.get("content-type") || ""
      let result: any = null

      if (contentType.includes("application/json")) {
        result = await res.json()
      } else {
        const text = await res.text()
        if (res.ok) {
          router.push("/thank-you")
          return
        }
        throw new Error(text || `Request failed (${res.status})`)
      }

      if (res.ok && (!result || result.ok)) {
        router.push("/thank-you")
        return
      }

      setSubmitted({
        ok: false,
        msg: (result && result.error) || "Submission failed. Please try again.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error. Please try again."
      setSubmitted({
        ok: false,
        msg: message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Format date for display (date only, no time)
  const formatDisplayDate = (date: string) => {
    return formatDateFriendly(date)
  }

  // Get display label for location
  const getLocationDisplayLabel = (locationId: LocationId): string => {
    const location = getLocationById(locationId)
    return location?.label || locationId
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "max-w-3xl mx-auto grid gap-4 rounded-xs border border-gray-200 bg-white shadow-xs p-6 md:p-4",
        className,
      )}
      id="registration-form"
      aria-labelledby="registration-title"
      noValidate
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 id="registration-title" className="text-2xl font-semibold text-gray-900">
          Secure Your Eye Test Appointment
        </h2>
        <p className="text-gray-600 text-sm">Fill out the form below to book your eye test consultation slot.</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-5 py-6 rounded-xs">
        {/* Full Name */}
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Full Name *
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
            )}
            placeholder="Enter your full name"
            autoComplete="name"
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-red-500 text-xs mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-900">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
            )}
            placeholder="you@example.com"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="grid gap-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-900">
            WhatsApp / Viber Number (with ISD Code) *
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
            )}
            placeholder="+679 123 4567"
            autoComplete="tel"
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-xs mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Location - Only Fiji Eye Test available */}
        <div className="grid gap-2">
          <label htmlFor="country" className="text-sm font-medium text-gray-900">
             Country *
          </label>
          <select
            id="country"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value as LocationId)}
            className="h-12 rounded-xs border border-gray-300 text-sm bg-white px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {getAllLocationIds().map((locationId) => {
              const location = getLocationById(locationId)
              if (!location) return null

              return (
                <option key={locationId} value={locationId}>
                  {getFlagEmoji(locationId)} {location.label}
                </option>
              )
            })}
          </select>
        </div>

        {/* Date */}
        <div className="grid gap-2">
          <label htmlFor="date" className="text-sm font-medium text-gray-900">
            Preferred Date *
          </label>
          <select
            id="date"
            required
            disabled={!availableDates.length}
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
              !availableDates.length ? "opacity-50 cursor-not-allowed" : "",
            )}
            aria-describedby={errors.date ? "date-error" : undefined}
          >
            <option value="" disabled>
              {availableDates.length ? "Select date" : "No dates available"}
            </option>
            {availableDates.map((dateObj, index) => (
              <option key={`${dateObj.date}-${index}`} value={dateObj.date}>
                {dateObj.display}
              </option>
            ))}
          </select>
          {errors.date && (
            <p id="date-error" className="text-red-500 text-xs mt-1">
              {errors.date}
            </p>
          )}
        </div>

        {/* Time Slot */}
        <div className="grid gap-2">
          <label htmlFor="timeSlot" className="text-sm font-medium text-gray-900">
            Preferred Time Slot *
          </label>
          <select
            id="timeSlot"
            required
            disabled={!form.date || !availableTimeSlots.length}
            value={form.timeSlot}
            onChange={(e) => onChange("timeSlot", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.timeSlot ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
              !form.date || !availableTimeSlots.length ? "opacity-50 cursor-not-allowed" : "",
            )}
            aria-describedby={errors.timeSlot ? "timeSlot-error" : undefined}
          >
            <option value="" disabled>
              {!form.date ? "Select a date first" : availableTimeSlots.length ? "Select time slot" : "No slots available"}
            </option>
            {availableTimeSlots.map((slot, index) => (
              <option key={`${slot.time}-${index}`} value={slot.time}>
                {slot.displayTime}
              </option>
            ))}
          </select>
          {errors.timeSlot && (
            <p id="timeSlot-error" className="text-red-500 text-xs mt-1">
              {errors.timeSlot}
            </p>
          )}
        </div>

        {/* Venue Display (Read-only) */}
        {selectedDateDetails?.venue && (
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium text-gray-900">
              Selected Venue
            </label>
            <div className="h-12 rounded-xs border border-gray-300 text-sm bg-white px-4 flex items-center">
              {selectedDateDetails.venue}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="md:col-span-2 grid gap-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-900">
            Eye Concerns / Additional Information
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className="min-h-[150px] rounded-xs border border-gray-300 text-sm bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical"
            placeholder="Briefly describe your eye concerns (e.g., blurry vision, cataract, glaucoma, retina issues, etc.) or any additional information..."
          />
        </div>
      </div>

      {/* Status Message */}
      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-xs px-4 py-3 text-sm font-medium",
            submitted.ok
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200",
          )}
        >
          {submitted.msg}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className='h-12 w-full rounded-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gray-100 text-gray-800 hover:bg-gray-200'
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          "Register Now"
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        By submitting, you agree to our terms and consent to be contacted regarding your eye test appointment.
      </p>
    </form>
  )
}