"use client"
import { useMemo, useState } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  schedule,
  type LocationId,
  getFlagEmoji,
  getLocationById,
  getAllLocationIds,
  formatDateFriendly
} from "@/lib/schedule"

type FormState = {
  name: string
  email: string
  phone: string
  country: LocationId
  date: string
  notes: string
}

type FormErrors = {
  name?: string
  email?: string
  phone?: string
  country?: string
  date?: string
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
    country: "png", // Default to first location
    date: "",
    notes: "",
  })

  const currentLocation = useMemo(() => getLocationById(form.country), [form.country])

  // Get available dates with their times and venues
  const availableDates = useMemo(() => {
    if (!currentLocation) return []

    return currentLocation.dates.map((date, index) => ({
      date,
      time: currentLocation.times[index] || "",
      venue: currentLocation.venues[index] || ""
    }))
  }, [currentLocation])

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onChange = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === "country") next.date = "" // Reset date when country changes
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
      const selectedDate = availableDates.find(d => d.date === form.date)
      const selectedLocation = getLocationById(form.country)

      if (!selectedLocation) {
        throw new Error("Invalid location selected")
      }

      const formData = {
        name: form.name.trim(),
        email: form.email.trim(),
        countryName: selectedLocation.label,
        countryCode: "+61",
        whatsapp: form.phone.replace(/\D/g, ""),
        message: `Appointment Request - ${selectedLocation.label} on ${form.date} (${selectedDate?.time}) at ${selectedDate?.venue}. ${form.notes ? `Notes: ${form.notes}` : ""}`,
      }

      const res = await fetch("/api/submit", {
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

  // Format date for display with time and venue
  const formatDisplayDate = (dateObj: { date: string; time: string; venue: string }) => {
    const formattedDate = formatDateFriendly(dateObj.date)
    return `${formattedDate}, ${dateObj.time}, ${dateObj.venue}`
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
        "max-w-3xl mx-auto grid gap-8 rounded-xs border border-gray-200 bg-white shadow-xs p-6 md:p-4",
        className,
      )}
      id="registration-form"
      aria-labelledby="registration-title"
      noValidate
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 id="registration-title" className="text-2xl font-semibold text-gray-900">
          Secure Your Appointment
        </h2>
        <p className="text-gray-600 text-sm">Fill out the form below to book your consultation slot.</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-5 py-6 rounded-xl">
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
              "h-12 rounded-lg border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
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
              "h-12 rounded-lg border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
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
            Phone *
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={cn(
              "h-12 rounded-lg border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
            )}
            placeholder="+61 400 000 000"
            autoComplete="tel"
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p id="phone-error" className="text-red-500 text-xs mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="grid gap-2">
          <label htmlFor="country" className="text-sm font-medium text-gray-900">
            Location *
          </label>
          <select
            id="country"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value as LocationId)}
            className="h-12 rounded-lg border border-gray-300 text-sm bg-white px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
            Preferred Date & Time *
          </label>
          <select
            id="date"
            required
            disabled={!availableDates.length}
            value={form.date}
            onChange={(e) => onChange("date", e.target.value)}
            className={cn(
              "h-12 rounded-lg border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500",
              !availableDates.length ? "opacity-50 cursor-not-allowed" : "",
            )}
            aria-describedby={errors.date ? "date-error" : undefined}
          >
            <option value="" disabled>
              {availableDates.length ? "Select date & time" : "No dates available"}
            </option>
            {availableDates.map((dateObj, index) => (
              <option key={`${dateObj.date}-${index}`} value={dateObj.date}>
                {formatDisplayDate(dateObj)}
              </option>
            ))}
          </select>
          {errors.date && (
            <p id="date-error" className="text-red-500 text-xs mt-1">
              {errors.date}
            </p>
          )}
        </div>

        {/* Location Contact Info */}
        <div className="md:col-span-2 grid gap-2">
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-xs">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <span className="text-lg">{currentLocation && getFlagEmoji(form.country)}</span>
              {currentLocation?.label} - Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-800">
                  <strong>Local Contact:</strong>
                </p>
                <p className="text-gray-600 mt-1">{currentLocation?.localContact || "Not specified"}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-800">
                  <strong>Meeting Fee:</strong>
                </p>
                <p className="text-gray-600 mt-1">{currentLocation?.feeLabel || "Not specified"}</p>
              </div>
            </div>
            <div className="mt-2 border-gray-200 border-t pt-2">
              <p className="text-gray-800 font-medium text-sm mb-2">Available Slots:</p>
              <div className="space-y-2">
                {availableDates.map((dateObj, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{formatDisplayDate(dateObj)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2 grid gap-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-900">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className="min-h-[100px] rounded-lg border border-gray-300 text-sm bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical"
            placeholder="Briefly describe your concern or any additional information..."
          />
        </div>
      </div>

      {/* Status Message */}
      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
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
        className={cn(
          "h-12 w-full rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
          loading
            ? "bg-gray-400 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 focus:ring-offset-white",
        )}
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
          "Book Appointment"
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        By submitting, you agree to our terms and consent to be contacted regarding your appointment.
      </p>
    </form>
  )
}