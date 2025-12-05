"use client";

import type React from "react";
import { useMemo, useState, useEffect } from "react";

// --- Helper Functions and Mocks ---
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// UPDATED STYLING:
// - ACCENT_CLASS uses the project's primary green (#74BF44) for focus rings and text color (#241d1f).
// - BUTTON_BG_CLASS uses the project's primary green (#74BF44) for the background.
// - TAB_ACTIVE_CLASS uses the primary green for the border and primary text color for the text.
const ACCENT_CLASS = "text-[#241d1f] focus-visible:ring-[#74BF44]/50 focus:ring-[#74BF44]/50 focus:border-[#74BF44]";
const BUTTON_BG_CLASS = "bg-[#74BF44] hover:bg-[#62a637] focus:ring-[#74BF44]";
const TAB_ACTIVE_CLASS = "border-[#74BF44] text-[#241d1f]";

// Mock Country Data
const MOCK_COUNTRY_DATA: { name: string; code: string; dial: string }[] = [
  { name: "United States", code: "US", dial: "+1" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "South Africa", code: "ZA", dial: "+27" },
];

// Mock API Submission
type SubmissionPayload = {
  connectionType: string;
  name: string;
  email: string;
  countryName: string;
  countryCode: string;
  whatsapp: string;
  message: string;
};

const submitContact = async (payload: SubmissionPayload) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log("Mock Submission Payload:", payload);
  if (payload.name && payload.email && payload.message) {
    return { ok: true };
  } else {
    return { ok: false, error: "Validation failed (Missing Name, Email, or Message)." };
  }
};

// --- Types ---
type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type CountryRow = { name: string; iso: string; dial: string };
type ConnectionTab = "medivisor" | "hospital" | "doctor";

// --- Icons ---
const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M12 10V6"/>
    <path d="M15 10V6"/>
    <path d="M9 10V6"/>
  </svg>
);

const StethoscopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A1 1 0 1 0 6 4a6.56 6.56 0 0 1 5.5 6v.5a7 7 0 0 0 2 5.5a7 7 0 0 0 5.5 2a7 7 0 0 0 5.5-2a7 7 0 0 0 2-5.5v-.5A6.56 6.56 0 0 1 22 4a1 1 0 1 0 1.2-1.7A9 9 0 0 0 18 0a9 9 0 0 0-5.2 2.3A9 9 0 0 0 7.8.3 9 9 0 0 0 2.6.8 1 1 0 0 0 4.8 2.3Z"/>
    <circle cx="18" cy="16" r="4"/>
  </svg>
);

const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
);

// --- Component Replacements (Using updated ACCENT_CLASS) ---
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn("flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all h-10", ACCENT_CLASS, className)} {...props} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
  <textarea className={cn("flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all", ACCENT_CLASS, className)} {...props} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  // Note: ACCENT_CLASS is applied to the focus ring via BUTTON_BG_CLASS's focus ring setting
  <button className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 h-10 px-4 py-2", className)} {...props}>
    {children}
  </button>
);

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  
  // Primary tab state, determined by the current URL (e.g., Hospital page -> Hospital tab)
  const [primaryTab, setPrimaryTab] = useState<{ id: ConnectionTab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }>({
    id: "medivisor",
    label: "Connect Medivisor",
    icon: UserPlusIcon
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<ConnectionTab>("medivisor");

  // Detect current page from URL to set the primary tab
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname.toLowerCase();

    let detectedTab: ConnectionTab = "medivisor";
    let label = "Contact  Medivisor";
    let Icon = UserPlusIcon;

    if (pathname.includes("/hospital") || pathname.includes("/branches")) {
      detectedTab = "hospital";
      label = "Contact  Hospital";
      Icon = BuildingIcon;
    } else if (pathname.includes("/doctor") || pathname.includes("/doctors")) {
      detectedTab = "doctor";
      label = "Contact  Doctor";
      Icon = StethoscopeIcon;
    }
    // For pages like /treatment/[slug] or home, it remains "medivisor"

    setPrimaryTab({ id: detectedTab, label, icon: Icon });
    setActiveTab(detectedTab); // Auto-select the relevant tab
  }, []);

  // Define which tabs to render based on the primary tab
  const tabsToRender = useMemo(() => {
    // If we're on a specific entity page (Hospital/Doctor), show that tab and the Medivisor tab.
    if (primaryTab.id !== 'medivisor') {
        return [
            primaryTab,
            { id: "medivisor" as ConnectionTab, label: "Contact Medivisor", icon: UserPlusIcon }
        ];
    }
    // If we're on a general page (Medivisor primary), only show the Medivisor tab.
    return [primaryTab];
  }, [primaryTab]);

  // Countries setup
  const countries = useMemo<CountryRow[]>(() => {
    return MOCK_COUNTRY_DATA.map(c => ({
      name: c.name,
      iso: c.code,
      dial: c.dial,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const uniqueDialCodes = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) set.add(c.dial);
    return Array.from(set).sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", "")));
  }, [countries]);

  const defaultCountry = useMemo<CountryRow>(() => {
    return countries.find((c) => c.iso === "IN") || countries[0] || { name: "India", iso: "IN", dial: "+91" };
  }, [countries]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    countryIso: defaultCountry.iso,
    countryName: defaultCountry.name,
    countryCode: defaultCountry.dial,
    whatsapp: "",
    message: "",
  });

  // Auto-detect user country via IP
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) return;
        const data = await response.json();
        const match = countries.find((c) => c.iso === data.country_code);
        if (match) {
          setForm(prev => ({
            ...prev,
            countryIso: match.iso,
            countryName: match.name,
            countryCode: match.dial,
          }));
        }
      } catch (e) { /* ignore */ }
    };
    if (countries.length > 0) fetchUserCountry();
  }, [countries]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const iso = e.target.value;
    const match = countries.find(c => c.iso === iso);
    if (match) {
      setForm(f => ({
        ...f,
        countryIso: match.iso,
        countryName: match.name,
        countryCode: match.dial,
      }));
    }
  };

  const onDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, countryCode: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!/^\+\d{1,4}$/.test(form.countryCode)) return "Invalid country code.";
    if (!/^[0-9]{6,15}$/.test(form.whatsapp)) return "Enter a valid WhatsApp number (6-15 digits).";
    if (!form.message.trim()) return "Please enter a message.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setStatus({ state: "error", message: error });
      return;
    }

    setStatus({ state: "submitting" });
    try {
      const payload: SubmissionPayload = {
        connectionType: activeTab === "medivisor" ? "Connect to Medivisor" :
                        activeTab === "hospital" ? "Connect to Hospital" :
                        "Connect to Doctor",
        name: form.name.trim(),
        email: form.email.trim(),
        countryName: form.countryName,
        countryCode: form.countryCode,
        whatsapp: form.whatsapp.replace(/\D/g, ""),
        message: form.message.trim(),
      };

      const res = await submitContact(payload);
      if (res.ok) {
        setStatus({ state: "success", message: "Request sent successfully! We'll contact you soon." });
        setForm(prev => ({ ...prev, name: "", email: "", whatsapp: "", message: "" }));
      } else {
        setStatus({ state: "error", message: res.error || "Submission failed." });
      }
    } catch {
      setStatus({ state: "error", message: "Network error. Please try again." });
    }
  };

  // Tab Component
  const TabButton = ({ 
    type, 
    icon: Icon, 
    label 
  }: { 
    type: ConnectionTab; 
    icon: React.FC<React.SVGProps<SVGSVGElement>>; 
    label: string; 
  }) => {
    const isActive = activeTab === type;
    return (
      <button
        type="button"
        onClick={() => {
          setActiveTab(type);
          setStatus({ state: "idle" });
        }}
        // UPDATED: Added icon display and refined classes
        className={cn(
          "flex-1 flex items-center justify-center p-3 text-sm font-light transition-colors border-b-2 -mb-[1px] hover:bg-gray-100",
          isActive ? `${TAB_ACTIVE_CLASS} border-b-2 font-medium` : "border-transparent text-gray-500 hover:text-[#241d1f] hover:border-gray-200"
        )}
      >
        <div className="flex items-center space-x-2">
            {/* <Icon className="w-4 h-4" /> */}
            <span>{label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-fit rounded-xs shadow-xs sticky top-4 lg:top-16">
      <div className="bg-white rounded-xs overflow-hidden border border-gray-200">
        
        {/* Dynamic Tabs (Fixed logic: shows 1 tab on general pages, 2 distinct tabs on entity pages) */}
        <div className={`flex border-b border-gray-200 bg-gray-50 ${tabsToRender.length === 1 ? 'justify-center' : ''}`}>
            {tabsToRender.map(tab => (
                <TabButton key={tab.id} type={tab.id} icon={tab.icon} label={tab.label} />
            ))}
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4">
              <Input name="name" value={form.name} onChange={onChange} placeholder="Enter Your Full Name" required />
              <Input type="email" name="email" value={form.email} onChange={onChange} placeholder="Enter Your Email Address" required />

              <div className="grid gap-2 pt-2">
                <p className="text-sm font-medium text-gray-700">Contact Details (WhatsApp preferred)</p>
                
                <div className="relative">
                  <select 
                    value={form.countryIso} 
                    onChange={onCountryChange} 
                    className={cn("appearance-none block w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 transition-all cursor-pointer", ACCENT_CLASS)}
                  >
                    <option value="" disabled>Select Country</option>
                    {countries.map(c => <option key={c.iso} value={c.iso}>{c.name}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </div>

                <div className="flex gap-x-3">
                  <div className="relative w-20 flex-shrink-0">
                    <select 
                      value={form.countryCode} 
                      onChange={onDialCodeChange} 
                      className={cn("appearance-none block w-full h-10 rounded-md border border-gray-300 bg-gray-50 py-1.5 px-2 text-sm focus:outline-none focus:ring-1 transition-all cursor-pointer", ACCENT_CLASS)}
                    >
                      {uniqueDialCodes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </div>
                  <Input name="whatsapp" value={form.whatsapp} onChange={onChange} placeholder="WhatsApp Number" inputMode="numeric" pattern="[0-9]*" className="flex-1" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter digits only. We'll add your country code.</p>
              </div>

              <Textarea
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder={
                  activeTab === "hospital" ? "E.g., We are a 500-bed hospital in Mumbai looking to partner..." :
                  activeTab === "doctor" ? "E.g., I am a cardiologist interested in AI-assisted diagnosis..." :
                  "E.g., I need help understanding my recent blood test results..."
                }
                rows={4}
                required
                className="min-h-[120px]"
              />
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                disabled={status.state === "submitting"}
                className={cn("w-full text-white py-2 shadow-md md:font-medium", BUTTON_BG_CLASS)}
              >
                {status.state === "submitting" ? "Sending..." : 
                  activeTab === "hospital" ? "Submit Hospital Request" :
                  activeTab === "doctor" ? "Submit Doctor Request" :
                  "Submit Consultation Request"}
              </Button>

              <p className={cn("text-sm text-center", 
                status.state === "success" ? "text-green-600 font-semibold" :
                status.state === "error" ? "text-red-600 font-semibold" : "text-gray-500"
              )} role="status" aria-live="polite">
                {status.state === "success" || status.state === "error" ? status.message : "We typically respond within 1 business day."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}