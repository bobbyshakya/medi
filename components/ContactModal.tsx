'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, Check, AlertCircle, X, Phone, User, MessageSquare, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { getData } from "country-list";
import { getCountryCallingCode } from "libphonenumber-js";
import { submitContact } from "@/app/api/submit-form/route";

// Define the component and its types
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

interface CountryRow {
  name: string;
  iso: string;
  dial: string;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [isLocating, setIsLocating] = useState(true);
  const router = useRouter();

  // Build country dataset and helpers (client-side)
  const countries = useMemo<CountryRow[]>(() => {
    const base = getData()
      .map((c: any) => {
        let dial = "";
        try {
          dial = `+${getCountryCallingCode(c.code)}`;
        } catch {
          dial = "";
        }
        return { name: c.name, iso: c.code, dial };
      })
      .filter((c: any) => c.dial)
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
    return base;
  }, []);

  const uniqueDialCodes = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) set.add(c.dial);
    return Array.from(set).sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", "")));
  }, [countries]);

  const defaultCountry = useMemo<CountryRow>(() => {
    return countries.find((c) => c.iso === "US") || countries[0] || { name: "United States", iso: "US", dial: "+1" };
  }, [countries]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    countryIso: defaultCountry?.iso || "US",
    countryName: defaultCountry?.name || "United States",
    countryCode: defaultCountry?.dial || "+1",
    whatsapp: "",
    message: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = e.target.value;
    const match = countries.find((c) => c.iso === iso);
    if (!match) return;
    setForm((f) => ({
      ...f,
      countryIso: match.iso,
      countryName: match.name,
      countryCode: match.dial,
    }));
  };

  const onDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dial = e.target.value;
    setForm((f) => ({ ...f, countryCode: dial }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email.";
    if (!/^\+\d{1,4}$/.test(form.countryCode)) return "Enter a valid country code (e.g., +1, +44, +91).";
    if (!/^[0-9]{6,15}$/.test(form.whatsapp)) return "Enter a valid WhatsApp number (6-15 digits).";
    if (!form.message.trim()) return "Please enter a message.";
    return null;
  };

  const handleClose = () => {
    setForm({
      name: "",
      email: "",
      countryIso: defaultCountry?.iso || "US",
      countryName: defaultCountry?.name || "United States",
      countryCode: defaultCountry?.dial || "+1",
      whatsapp: "",
      message: "",
    });
    setStatus({ state: "idle" });
    onClose();
  };

  // Effect to automatically detect the user's location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();

            const countryCode = data?.address?.country_code?.toUpperCase();
            if (countryCode) {
              const detectedCountry = countries.find(c => c.iso === countryCode);
              if (detectedCountry) {
                setForm(f => ({
                  ...f,
                  countryIso: detectedCountry.iso,
                  countryName: detectedCountry.name,
                  countryCode: detectedCountry.dial,
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching country from coordinates:", error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Geolocation failed:", error);
          setIsLocating(false);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }
  }, [countries]);

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
        setStatus({ state: "success", message: "Message sent! Redirecting..." });
        setTimeout(() => {
          router.push('/thank-you');
          handleClose();
        }, 2000);
      } else {
        setStatus({ state: "error", message: res?.error || "Something went wrong. Please try again." });
      }
    } catch (err: any) {
      setStatus({ state: "error", message: err?.message || "Unexpected error. Please try again." });
    }
  };

  const isSubmitting = status.state === "submitting" || isLocating || status.state === "success";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-sm h-auto mx-auto p-0 bg-white rounded-xs shadow-sm border-0 overflow-y-scroll md:overflow-hidden">
        {/* Compact Header */}
        <div className="relative border-gray-100 bg-gray-100 border-b px-4 pt-7">
           
          <div className="text-center px-8">
            <DialogTitle className="title-heading mb-4">
             Enquire Now
            </DialogTitle>
          </div>
        </div>

        {/* Compact Content */}
        <div className="px-4 pb-4">
          {status.state === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg mb-3 text-sm">
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{status.message}</span>
              </div>
            </div>
          )}
          {status.state === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{status.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* Name Field */}
            <div>
           
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Enter your Name"
                className="h-9 description-1 border-gray-300 focus:border-gray-200 focus:ring-gray-200 rounded-xs"
              />
            </div>

            {/* Email Field */}
            <div>
              
              <Input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder=" Enter Your Email Id"
                className="h-9 description-1 border-gray-300 focus:border-gray-200 focus:ring-gray-200 rounded-xs"
              />
            </div>

            {/* Country Selection */}
            <div>
            
              <div className="relative mt-1">
                <select
                  id="country-select"
                  value={form.countryIso}
                  onChange={onCountryChange}
                  className="h-9 w-full rounded-xs border border-gray-300 bg-white px-2 description-1  pr-8"
                  disabled={isLocating}
                >
                  {isLocating && <option value="" disabled>Locating...</option>}
                  {!isLocating && countries.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
                {isLocating && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
            
              <div className="flex gap-2 mt-1">
                <select
                  value={form.countryCode}
                  onChange={onDialCodeChange}
                  className="h-9 w-16 rounded-xs border border-gray-300 bg-white px-1 description-1 "
                >
                  {uniqueDialCodes.map((dial) => (
                    <option key={dial} value={dial}>
                      {dial}
                    </option>
                  ))}
                </select>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.whatsapp}
                  onChange={onChange}
                  placeholder="Enter Your Whatsapp Number"
                  className="h-9 description-1 border-gray-300 focus:border-gray-200 focus:ring-gray-200 rounded-xs flex-1"
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
             
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder="Tell us about your medical needs..."
                rows={3}
                className="description-1 border-gray-300 focus:border-gray-200 focus:ring-gray-200 rounded-xs resize-none"
              />
              <div className="flex justify-between text-xs text-[#241d1f] mt-1">
                <span>Min 10 chars</span>
                <span className={cn(form.message.length > 500 ? "text-red-500" : "")}>
                  {form.message.length || 0}/500
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full h-10 text-white font-medium text-sm rounded-xs shadow-md transition-all duration-200",
                "hover:bg-[#E22026] bg-[#74BF44] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLocating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Location...
                </>
              ) : status.state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : status.state === "success" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Sent!
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>

            {/* Compact Footer */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#241d1f]">
                Response within 24 hours • Secure & Private
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}