// registration-form.tsx
"use client";

import React, { useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  type LocationId,
  type TimeSlot,
  getFlagEmoji,
  getLocationById,
  getAllLocationIds,
  formatDateFriendly,
  getTimeSlotsForDate,
} from "@/lib/schedule";

type FormState = {
  name: string;
  email: string;
  phone: string;
  country: LocationId | "";
  date: string;
  timeSlot: string;
  notes: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  timeSlot?: string;
};

export default function ModernRegistrationForm({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<null | { ok: boolean; msg: string }>(null);
  const [errors, setErrors] = React.useState<FormErrors>({});

  const [form, setForm] = React.useState<FormState>({
    name: "",
    email: "",
    phone: "",
    country: "",
    date: "",
    timeSlot: "",
    notes: "",
  });

  // Only show countries that have future dates
  const availableLocationIds = useMemo(() => getAllLocationIds(), []);

  // Auto-select first available country on mount
  useEffect(() => {
    if (!form.country && availableLocationIds.length > 0) {
      setForm(prev => ({ ...prev, country: availableLocationIds[0] }));
    }
  }, [availableLocationIds, form.country]);

  // Current location (already filtered for future dates)
  const currentLocation = useMemo(() => {
    if (!form.country) return undefined;
    return getLocationById(form.country as LocationId);
  }, [form.country]);

  // Available future dates + venue/time info
  const availableDates = useMemo(() => {
    if (!currentLocation) return [];
    return currentLocation.dates.map((date, index) => ({
      date,
      time: currentLocation.times[index] || "",
      venue: currentLocation.venues[index] || "",
      dateIndex: index,
    }));
  }, [currentLocation]);

  // Available time slots (only isAvailable: true)
  const availableTimeSlots = useMemo((): TimeSlot[] => {
    if (!form.date || !currentLocation) return [];
    const dateIndex = availableDates.findIndex(d => d.date === form.date);
    if (dateIndex === -1) return [];
    return getTimeSlotsForDate(currentLocation, dateIndex);
  }, [form.date, currentLocation, availableDates]);

  const selectedDateDetails = useMemo(() => availableDates.find(d => d.date === form.date), [form.date, availableDates]);
  const selectedTimeSlotDetails = useMemo(() => availableTimeSlots.find(t => t.time === form.timeSlot), [form.timeSlot, availableTimeSlots]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    else if (form.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Please enter a valid email address";

    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (form.phone.replace(/\D/g, "").length < 6) newErrors.phone = "Please enter a valid phone number";

    if (!form.date) newErrors.date = "Please select a date";
    if (!form.timeSlot) newErrors.timeSlot = "Please select a time slot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (key: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "country") {
        next.date = "";
        next.timeSlot = "";
      } else if (key === "date") {
        next.timeSlot = "";
      }
      return next;
    });

    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSubmitted(null);

    try {
      const location = getLocationById(form.country as LocationId);
      if (!location) throw new Error("Invalid location");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        countryName: location.label,
        whatsapp: form.phone.replace(/\D/g, ""),
        message: form.notes.trim(),
        appointmentDate: form.date,
        appointmentTime: selectedTimeSlotDetails?.displayTime || form.timeSlot,
        appointmentVenue: selectedDateDetails?.venue || "",
        appointmentLocation: location.label,
      };

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/thank-you");
        return;
      }

      const text = await res.text();
      throw new Error(text || "Submission failed");
    } catch (error) {
      setSubmitted({
        ok: false,
        msg: error instanceof Error ? error.message : "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date: string) => formatDateFriendly(date);

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "max-w-3xl mx-auto grid gap-4 rounded-xs border border-gray-200 bg-white shadow-xs p-6 md:p-4",
        className
      )}
      noValidate
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Secure Your Appointment</h2>
        <p className="text-gray-600 text-sm">Fill out the form below to book your consultation slot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-5 py-6 rounded-xs">
        {/* Full Name */}
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">Full Name *</label>
          <input
            id="name"
            value={form.name}
            onChange={e => onChange("name", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            )}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-900">Email *</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={e => onChange("email", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            )}
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="grid gap-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-900">
            WhatsApp / Viber Number (with ISD Code) *
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={e => onChange("phone", e.target.value)}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            )}
            placeholder="+61 400 000 000"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Country */}
        <div className="grid gap-2">
          <label htmlFor="country" className="text-sm font-medium text-gray-900">Country *</label>
          <select
            id="country"
            value={form.country}
            onChange={e => onChange("country", e.target.value as LocationId)}
            className="h-12 rounded-xs border border-gray-300 text-sm bg-white px-4 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="">Select country</option>
            {availableLocationIds.map(id => {
              const loc = getLocationById(id);
              return loc ? (
                <option key={id} value={id}>
                  {getFlagEmoji(id)} {loc.label}
                </option>
              ) : null;
            })}
          </select>
        </div>

        {/* Date */}
        <div className="grid gap-2">
          <label htmlFor="date" className="text-sm font-medium text-gray-900">Preferred Date *</label>
          <select
            id="date"
            value={form.date}
            onChange={e => onChange("date", e.target.value)}
            disabled={!availableDates.length}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300",
              !availableDates.length && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="" disabled>
              {availableDates.length ? "Select date" : "No dates available"}
            </option>
            {availableDates.map(d => (
              <option key={d.date} value={d.date}>
                {formatDisplayDate(d.date)}
              </option>
            ))}
          </select>
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Time Slot */}
        <div className="grid gap-2">
          <label htmlFor="timeSlot" className="text-sm font-medium text-gray-900">Preferred Time Slot *</label>
          <select
            id="timeSlot"
            value={form.timeSlot}
            onChange={e => onChange("timeSlot", e.target.value)}
            disabled={!form.date || !availableTimeSlots.length}
            className={cn(
              "h-12 rounded-xs border text-sm bg-white px-2 outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
              errors.timeSlot ? "border-red-500 focus:ring-red-500" : "border-gray-300",
              (!form.date || !availableTimeSlots.length) && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="" disabled>
              {!form.date ? "Select a date first" : availableTimeSlots.length ? "Select time slot" : "No slots available"}
            </option>
            {availableTimeSlots.map(slot => (
              <option key={slot.time} value={slot.time}>
                {slot.displayTime}
              </option>
            ))}
          </select>
          {errors.timeSlot && <p className="text-red-500 text-xs mt-1">{errors.timeSlot}</p>}
        </div>

        {/* Venue Display */}
        {selectedDateDetails?.venue && (
          <div className="md:col-span-2 grid gap-2">
            <label className="text-sm font-medium text-gray-900">Selected Venue</label>
            <div className="h-12 rounded-xs border border-gray-300 text-sm bg-white px-4 flex items-center">
              {selectedDateDetails.venue}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="md:col-span-2 grid gap-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-900">Message</label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={e => onChange("notes", e.target.value)}
            className="min-h-[150px] rounded-xs border border-gray-300 text-sm bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical"
            placeholder="Briefly describe your concern or any additional information..."
          />
        </div>
      </div>

      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-xs px-4 py-3 text-sm font-medium",
            submitted.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {submitted.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "h-12 w-full rounded-xs font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
          loading ? "bg-gray-400 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          "Register Now"
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        By submitting, you agree to our terms and consent to be contacted regarding your appointment.
      </p>
    </form>
  );
}