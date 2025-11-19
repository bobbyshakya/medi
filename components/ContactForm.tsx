"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
// Assuming these are standard UI components (like from ShadCN)
// Note: These imports are typically mocked or handled by the environment in this context.
// We are keeping them here for structural clarity, but the code relies on pure HTML/Tailwind for rendering.
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { cn } from "@/lib/utils"

// --- Helper Functions and Mocks (Crucial for running in a single-file environment) ---

// Utility function to join class names (simplified version of cn from lib/utils)
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

// 1. Mock Country Data and Calling Code Logic (Replaces country-list and libphonenumber-js)
const MOCK_COUNTRY_DATA: { name: string, code: string, dial: string }[] = [
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

// 2. Mock submitContact function (Replaces "@/app/api/submit-form/route")
type SubmissionPayload = {
  connectionType: string;
  name: string;
  email: string;
  countryName: string;
  countryCode: string;
  whatsapp: string;
  message: string;
};

// Mock API call to simulate form submission
const submitContact = async (payload: SubmissionPayload) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Mock Submission Payload:", payload);

  // Simple success simulation.
  if (payload.name && payload.email && payload.message) {
    return { ok: true };
  } else {
    // Return a structured error if a key field is missing (for better mock testing)
    return { ok: false, error: "Validation failed (Missing Name, Email, or Message)." };
  }
};

// --- Types ---
type Status =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string }

type CountryRow = { name: string; iso: string; dial: string }
type ConnectionType = 'hospital' | 'medivisor';

// --- Icon SVGs for Tabs (Lucide icons approximation) ---
const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M12 10V6"/>
    <path d="M15 10V6"/>
    <path d="M9 10V6"/>
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

// --- Component Replacements (Simplified Input/Button/Textarea for standalone functionality) ---
// Note: Reduced size of inputs/text area slightly (h-10 instead of h-12 for input)
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input className={cn("flex w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs ring-offset-white file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all h-10", className)} {...props} />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea className={cn("flex min-h-[90px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all", className)} {...props} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
    <button className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2", className)} {...props}>
        {children}
    </button>
);


export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" })
  const [activeTab, setActiveTab] = useState<ConnectionType>('medivisor');

  // Build country dataset and helpers (client-side) using MOCK_COUNTRY_DATA
  const countries = useMemo<CountryRow[]>(() => {
    // Mapping MOCK_COUNTRY_DATA to the expected CountryRow type
    const base = MOCK_COUNTRY_DATA.map(c => ({
        name: c.name,
        iso: c.code,
        dial: c.dial,
    })).sort((a, b) => a.name.localeCompare(b.name));
    return base
  }, [])

  const uniqueDialCodes = useMemo(() => {
    const set = new Set<string>()
    for (const c of countries) set.add(c.dial)
    // Numeric sort by dial code
    return Array.from(set).sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", "")))
  }, [countries])

  const defaultCountry = useMemo<CountryRow>(() => {
    return countries.find((c) => c.iso === "IN") || countries[0] || { name: "India", iso: "IN", dial: "+91" }
  }, [countries])

  const [form, setForm] = useState({
    name: "",
    email: "",
    countryIso: defaultCountry?.iso || "IN",
    countryName: defaultCountry?.name || "India",
    countryCode: defaultCountry?.dial || "+91",
    whatsapp: "",
    message: "",
  })

  // Detect user's country on load using IP geolocation
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const iso = data.country_code;
        // Match against mock data
        const match = countries.find((c) => c.iso === iso);
        if (match) {
          setForm((prev) => ({
            ...prev,
            countryIso: match.iso,
            countryName: match.name,
            countryCode: match.dial,
          }));
        }
      } catch (error) {
        // Fallback to default (IN)
      }
    };

    if (countries.length > 0) {
        fetchUserCountry();
    }
  }, [countries]);

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
    if (!form.name.trim()) return "Please enter your full name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address."
    if (!/^\+\d{1,4}$/.test(form.countryCode)) return "Enter a valid country code (e.g., +1, +44, +91)."
    if (!/^[0-9]{6,15}$/.test(form.whatsapp)) return "Enter a valid WhatsApp number (6-15 digits)."
    if (!form.message.trim()) return "Please enter a message explaining your request."
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
        // Include the connection type in the submission
        connectionType: activeTab === 'hospital' ? 'Connect to Hospital' : 'Connect to Medivisor', 
        name: form.name.trim(),
        email: form.email.trim(),
        countryName: form.countryName,
        countryCode: countryCodeNormalized,
        whatsapp: whatsappNormalized,
        message: form.message.trim(),
      });
      
      if (res?.ok) {
        // Success message and reset form
        setStatus({ state: "success", message: "Request successfully sent! We'll contact you shortly." });
        setForm(prev => ({
            ...prev,
            name: "",
            email: "",
            whatsapp: "",
            message: "",
        })); 
      } else {
        setStatus({ state: "error", message: res?.error || "Submission failed. Please try again." });
      }
    } catch (err: any) {
      setStatus({ state: "error", message: err?.message || "Unexpected network error. Please try again." });
    }
  };

  const TabButton = ({ type, icon: Icon, label }: { type: ConnectionType, icon: React.FC<React.SVGProps<SVGSVGElement>>, label: string }) => {
    const isActive = activeTab === type;
    const isHospital = type === 'hospital';
    
    // Use Red theme for the active tab accent
    const activeClasses = isHospital 
        ? "border-gray-600 text-gray-600" 
        : "border-gray-300 text-gray-700";
        
    const inactiveClasses = "border-transparent text-gray-800 hover:text-gray-700 hover:border-gray-200";

    return (
      <button
        type="button"
        onClick={() => {
          setActiveTab(type);
          setStatus({ state: "idle" }); // Reset status when switching tabs
        }}
        className={cn(
          "flex-1 flex items-center justify-center p-3 text-xs font-semibold transition-colors border-b-2",
          isActive
            ? activeClasses
            : inactiveClasses,
        )}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </button>
    );
  };

  return (
    <div className="w-full h-fit rounded-xs shadow-xs sticky top-4 lg:top-16">
      <div className="bg-white rounded-s shadow-xs border border-gray-100 overflow-hidden">
        
        {/* Tab Selector */}
        <div className="flex border-b border-gray-100">
         
          <TabButton 
            type="medivisor" 
            icon={UserPlusIcon} 
            label="Medivisor" 
          />
           <TabButton 
            type="hospital" 
            icon={BuildingIcon} 
            label="Hospital" 
          />
        </div>

        {/* Form Content */}
        <div className="p-5 md:p-4">
          <h2 className="text-lg font-medium text-gray-800 mb-3">
        {activeTab === "hospital" ? "Connect with Hospital" : "Connect with Medivisor"}

          </h2>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            
            <div className="grid gap-4">
              
              {/* Full Name Input */}
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={onChange} 
                placeholder="Full Name / Company Representative" 
                required 
              />

              {/* Email Input */}
              <Input 
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="Email Address (e.g., contact@hospital.com)"
                required
              />

              {/* Contact Details Header and Country/WhatsApp Group */}
              <div className="grid gap-2">
                <p className="text-xs font-medium text-gray-700">Contact Details (WhatsApp is preferred)</p>
                
                {/* Country Select */}
                <div className="relative">
                  <select
                    aria-label="Country"
                    value={form.countryIso}
                    onChange={onCountryChange}
                    // Reduced h-10 to h-9 for slightly smaller appearance
                    className="appearance-none block w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select Country</option>
                    {countries.map((c) => (
                      <option key={c.iso} value={c.iso}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </div>

                <div className="flex gap-x-2">
                  {/* Country Code Select */}
                  <div className="relative w-16 flex-shrink-0">
                    <select
                      aria-label="Dial Code"
                      value={form.countryCode}
                      onChange={onDialCodeChange}
                      // Reduced h-10 to h-9
                      className="appearance-none block w-full h-10 rounded-md border border-gray-300 bg-gray-50 py-1.5 px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all cursor-pointer"
                    >
                      {uniqueDialCodes.map((dial) => (
                        <option key={dial} value={dial}>
                          {dial}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </div>
                  
                  {/* WhatsApp Number Input */}
                  <Input 
                    id="whatsapp"
                    name="whatsapp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.whatsapp}
                    onChange={onChange}
                    placeholder="WhatsApp Number"
                    aria-label="WhatsApp number"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-0">Enter digits only. We'll combine this with your country code.</p>
              </div>


              {/* Message Textarea */}
              <Textarea
                id="message"
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder={
                  activeTab === 'hospital' 
                    ? "E.g., We are a 500-bed hospital in [City, Country] looking to integrate your medical AI services."
                    : "E.g., I need advice on my recent diagnosis of [Condition] and want to understand my treatment options."
                }
                rows={4} // Reduced rows
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                disabled={status.state === "submitting"} 
                // Primary button color set to Red: #E22026 (or close Tailwind equivalent)
                className="w-full bg-gray-700 text-white py-2 rounded-xs text-xs hover:bg-gray-800 transition-all font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-gray-400/50"
              >
                {status.state === "submitting" ? "Sending Request..." : 
                (activeTab === 'hospital' ? "Submit Partnership Request" : "Submit Consultation Request")}
              </Button>
              <p
                className={cn(
                  "text-xs text-center",
                  status.state === "success"
                    ? "text-green-600"
                    : status.state === "error"
                      ? "text-red-600 font-medium"
                      : "text-gray-800",
                )}
                role="status"
                aria-live="polite"
              >
                {status.state === "success" || status.state === "error" ? status.message : "We typically respond within one business day."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}