

"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { submitContact } from "@/app/api/submit-form/route"
import { getData } from "country-list"
import { getCountryCallingCode } from "libphonenumber-js"

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

type CountryRow = { name: string; iso: string; dial: string }

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" })

  // Build country dataset and helpers (client-side)
  const countries = useMemo<CountryRow[]>(() => {
    const base = getData()
      .map((c:any) => {
        let dial = ""
        try {
          dial = `+${getCountryCallingCode(c.code)}`
        } catch {
          dial = ""
        }
        return { name: c.name, iso: c.code, dial }
      })
      .filter((c:any) => c.dial)
     .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
    return base
  }, [])

  const uniqueDialCodes = useMemo(() => {
    const set = new Set<string>()
    for (const c of countries) set.add(c.dial)
    return Array.from(set).sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", "")))
  }, [countries])

  const defaultCountry = useMemo<CountryRow>(() => {
    return countries.find((c) => c.iso === "US") || countries[0] || { name: "United States", iso: "US", dial: "+1" }
  }, [countries])

  const [form, setForm] = useState({
    name: "",
    email: "",
    countryIso: defaultCountry?.iso || "US",
    countryName: defaultCountry?.name || "United States",
    countryCode: defaultCountry?.dial || "+1",
    whatsapp: "",
    message: "",
  })

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = e.target.value
    const match = countries.find((c) => c.iso === iso)
    if (!match) return
    setForm((f) => ({
      ...f,
      countryIso: match.iso,
      countryName: match.name,
      countryCode: match.dial, // sync dial code with selected country
    }))
  }

  const onDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dial = e.target.value
    setForm((f) => ({ ...f, countryCode: dial }))
  }

  const validate = () => {
    if (!form.name.trim()) return "Please enter your name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email."
    if (!/^\+\d{1,4}$/.test(form.countryCode)) return "Enter a valid country code (e.g., +1, +44, +91)."
    if (!/^[0-9]{6,15}$/.test(form.whatsapp)) return "Enter a valid WhatsApp number (6-15 digits)."
    if (!form.message.trim()) return "Please enter a message."
    return null
  }

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const error = validate();
  if (error) {
    setStatus({ state: "error", message: error });
    return;
  }
  setStatus({ state: "submitting" });
  try {
    const countryCodeNormalized = form.countryCode.startsWith("+") ? form.countryCode : `+${form.countryCode}`;
    const whatsappNormalized = form.whatsapp.replace(/\D/g, "");
    
    const res = await submitContact({
      name: form.name.trim(),
      email: form.email.trim(),
      countryName: form.countryName,
      countryCode: countryCodeNormalized,
      whatsapp: whatsappNormalized,
      message: form.message.trim(),
    });
    
    if (res?.ok) {
      // Redirect to the thank you page
      window.location.href = '/thank-you';
    } else {
      setStatus({ state: "error", message: res?.error || "Something went wrong. Please try again." });
    }
  } catch (err: any) {
    setStatus({ state: "error", message: err?.message || "Unexpected error. Please try again." });
  }
};

  return (

    <div className="bg-gray-50 font-sans p-4">
      <section className="" id="Contact">
        <div className="container mx-auto px-4 md:px-0">
          {/* Header */}

          {/* Main Grid: left side 2 grids, right side 1 grid */}
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {/* Left Section: Company Info & Map (spans 2 columns on large screens) */}
            <aside className="lg:col-span-2 space-y-6">
              {/* Company Info Card */}
              <div className="rounded-xs border border-gray-100 bg-white text-gray-800 shadow-xs p-6">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900">Medivisor India Treatment</h3>
                <p className="mt-1 text-[#241d1f]">
                  Medivisor House 359, Sector 1, Vaishali, Ghaziabad, (Delhi/NCR) India
                </p>
              </div>
              {/* Embedded Map Card */}
              <div className="container-with-height md:h-[400px] lg:h-[570px]">
                <div className="rounded-xs h-full overflow-hidden border border-gray-200 min-h-[200px] md:min-h-[480px] shadow-xs">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.8047131916287!2d77.33048667550091!3d28.635614475663065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb00e7555807%3A0x6dee23139fc9b750!2sMedivisor%20House!5e0!3m2!1sen!2sin!4v1747405592425!5m2!1sen!2sin"
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </aside>
            {/* Right Section: Form (spans 1 column) */}
            <main className="lg:col-span-1 w-full">
              <div className="overflow-hidden rounded-xs border border-gray-100 bg-white text-gray-800 shadow-xs">
                <div className="p-4 md:p-5 border-b border-gray-200">
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-900">How can we help you?</h3>
                </div>
                <div className="p-4 md:p-6">
                  {/* Status Alerts */}
                  <form onSubmit={onSubmit} className="space-y-5" noValidate>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input className="border-gray-300" id="name" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input className="border-gray-300"
                          id="email"
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={onChange}
                          placeholder="jane@example.com"
                          required
                        />
                      </div>

                      <div className="grid ">
                        <Label className="text-sm font-medium">Country and Code</Label>
                        <div className="grid ">
                          <select
                            aria-label="Country"
                            value={form.countryIso}
                            
                            onChange={onCountryChange}
                            className="h-10 w-full mt-1 rounded-md border border-r-0 border-gray-300 bg-muted px-3 text-sm "
                          >
                            {countries.map((c) => (
                              <option key={c.iso} value={c.iso}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                         
                        </div>
                      
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <div className="flex gap-x-3">
                          <select
                            aria-label="Country code"
                            value={form.countryCode}
                            onChange={onDialCodeChange}
                            className="h-10 w-20 rounded-md border border-gray-300 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {uniqueDialCodes.map((dial) => (
                              <option key={dial} value={dial}>
                                {dial}
                              </option>
                            ))}
                          </select>
                          <Input className="border-gray-300 rounded-l-none"
                            id="whatsapp"
                            name="whatsapp"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.whatsapp}
                            onChange={onChange}
                            placeholder="5551234567"
                        
                            aria-label="WhatsApp number"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Enter digits only. We’ll combine it with the selected code.</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          className="border-gray-300"
                          id="message"
                          name="message"
                          value={form.message}
                          onChange={onChange}
                          placeholder="How can we help you?"
                          rows={5}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-y-4">
                      <Button type="submit" disabled={status.state === "submitting"} className="bg-[#E22026] cursor-pointer md:block hidden hover:bg-[#74BF44] w-full text-white font-medium px-5 py-2 rounded-md shadow-md transition-all">
                        {status.state === "submitting" ? "Sending…" : "Send message"}
                      </Button>
                      <p
                        className={cn(
                          "text-sm",
                          status.state === "success"
                            ? "text-green-600"
                            : status.state === "error"
                              ? "text-red-600"
                              : "text-muted-foreground",
                        )}
                        role="status"
                        aria-live="polite"
                      >
                        {status.state === "success" || status.state === "error" ? status.message : null}
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>

  )
}
