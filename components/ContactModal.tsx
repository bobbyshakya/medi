'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, Check, AlertCircle, X, Phone, User, MessageSquare, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation'; // Import useRouter

// Define the component and its types
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CountryRow {
  name: string;
  iso: string;
  dial: string;
}

// Mock data for demo purposes
const mockCountries: CountryRow[] = [
  { name: "United States", iso: "US", dial: "+1" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Japan", iso: "JP", dial: "+81" },
  { name: "India", iso: "IN", dial: "+91" },
  { name: "China", iso: "CN", dial: "+86" },
  { name: "Brazil", iso: "BR", dial: "+55" },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

// Mock submit function for demo
const submitContact = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { ok: true };
};

// Define the validation schema for the form
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\d{6,15}$/, 'Please enter a valid WhatsApp number (6-15 digits)'),
  countryCode: z.string().regex(/^\+\d{1,4}$/, 'Please select a valid country code'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
});

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const router = useRouter(); // Initialize the router

  const countries = useMemo<CountryRow[]>(() => mockCountries, []);

  const defaultCountry = useMemo<CountryRow>(() => {
    return countries.find((c) => c.iso === "US") || countries[0] || { name: "United States", iso: "US", dial: "+1" };
  }, [countries]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      countryCode: defaultCountry.dial,
      message: ''
    }
  });

  const { reset, setValue, watch } = form;

  // Effect to handle success status and redirect
  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        router.push('/thank-you'); // Redirect to the thank you page
        onClose(); // Close the modal
      }, 2000); // 2-second delay before redirecting
      return () => clearTimeout(timer);
    }
  }, [submitStatus, onClose, router]); // Add router to dependency array

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
                setValue('countryCode', detectedCountry.dial);
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
  }, [countries, setValue]);

  const handleClose = () => {
    reset();
    setSubmitStatus(null);
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    const selectedCountry = countries.find(c => c.dial === values.countryCode);
    const countryName = selectedCountry ? selectedCountry.name : '';

    try {
      const res = await submitContact({
        name: values.name,
        email: values.email,
        countryName,
        countryCode: values.countryCode,
        whatsapp: values.phone,
        message: values.message,
      });

      if (res?.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueDialCodes = useMemo(() => {
    const set = new Set<string>();
    for (const c of countries) set.add(c.dial);
    return Array.from(set).sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", "")));
  }, [countries]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md h-auto mx-auto p-0 bg-white rounded-xs shadow-sm border-0 overflow-hidden">
        {/* Compact Header */}
        <div className="relative border border-gray-200 px-4 pt-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-2 bg-gray-100 right-2 h-6 w-6 rounded-full text-white transition-colors"
          >
            <X className="h-3 w-3  " />
          </Button>

          <div className="text-center pr-8">
            <DialogTitle className="text-2xl font-bold text-gray-600 mb-1">
              Explore Advanced Medical Care in India
            </DialogTitle>
          </div>
        </div>

        {/* Compact Content */}
        <div className="px-4 py-4">
          {submitStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg mb-3 text-sm">
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Message sent! Redirecting...</span>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Error sending message. Please try again.</span>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3" noValidate>
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="name" className="text-sm font-medium mb-1 text-gray-600 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Full Name
                    </Label>
                    <FormControl>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        className="h-9 text-sm border-gray-300 focus:border-[#E22026] focus:ring-[#E22026]/20 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email" className="text-sm font-medium mb-1 text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </Label>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="h-9 text-sm border-gray-300 focus:border-[#E22026] focus:ring-[#E22026]/20 rounded-md"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Country Selection */}
              <div className="relative">
                <Label htmlFor="country-select" className="text-sm font-medium mb-1 text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Country
                </Label>
                <div className="relative mt-1">
                  <select
                    id="country-select"
                    value={countries.find(c => c.dial === watch('countryCode'))?.iso || ''}
                    onChange={(e) => {
                      const selectedCountry = countries.find(c => c.iso === e.target.value);
                      if (selectedCountry) {
                        setValue('countryCode', selectedCountry.dial, { shouldValidate: true });
                      }
                    }}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:border-[#E22026] focus:ring-2 focus:ring-[#E22026]/20 appearance-none pr-8"
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
                <Label htmlFor="whatsapp" className="text-sm font-medium mb-1 text-gray-600 flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  WhatsApp/Viber
                </Label>
                <div className="flex gap-2 mt-1">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <select
                        {...field}
                        className="h-9 w-16 rounded-md border border-gray-300 bg-white px-1 text-xs focus:outline-none focus:border-[#E22026] focus:ring-2 focus:ring-[#E22026]/20"
                      >
                        {uniqueDialCodes.map((dial) => (
                          <option key={dial} value={dial}>
                            {dial}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            id="whatsapp"
                            placeholder="5551234567"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="h-9 text-sm border-gray-300 focus:border-[#E22026] focus:ring-[#E22026]/20 rounded-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Message Field */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="message" className="text-sm font-medium mb-1 text-gray-600 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Label>
                    <FormControl>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your medical needs..."
                        rows={3}
                        className="text-sm border-gray-300 focus:border-[#E22026] focus:ring-[#E22026]/20 rounded-md resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>Min 10 chars</span>
                      <span className={cn(
                        field.value?.length > 500 ? "text-red-500" : ""
                      )}>
                        {field.value?.length || 0}/500
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || isLocating || submitStatus === 'success'}
                className={cn(
                  "w-full h-10 text-white font-medium text-sm rounded-md shadow-md transition-all duration-200",
                  "bg-[#E22026] hover:bg-[#74BF44] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Location...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : submitStatus === 'success' ? (
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
                <p className="text-sm text-gray-600">
                  Response within 24 hours • Secure & Private
                </p>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}