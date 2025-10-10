'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Hospital, Phone, Mail, MapPin, Loader2, Check, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid WhatsApp number with country code'),
  country: z.string().min(2, 'Please select your country'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters')
});

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      message: ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      form.reset();
      
      // Redirect to thank you page after success
      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const offices = [
    { label: 'India Office', phone: '+91 8340 780 250' },
    { label: 'Mauritius Office', phone: '+230 5828 5542' },
    { label: 'Fiji Office', phones: ['+679 9470588 (Suva)', '+679 9470527 (Lautoka)', '+679 9789990 (Labasa)'] },
    { label: 'Vanuatu Office', phones: ['+678 7627430', '+678 5213197', '+678 7743083'] },
    { label: 'Solomon Office', phone: '+677 7618955' },
    { label: 'PNG Office', phone: '+675 74376546' }
  ];

  return (
    <section className="md:py-20 py-10 bg-gray-50" id="Contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-6">
          <div className="inline-block px-4 py-1.5 bg-red-100 text-[#E22026] rounded-full text-sm md:text-base font-semibold mb-4">
            Get In Touch
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-snug">
            Contact Medivisor India Treatment
          </h2>
          <p className="text-[#241d1f] my-3 max-w-2xl mx-auto text-base">
            We're here to assist international patients from around the world in accessing high-quality
            medical care in India.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 mb-9 gap-x-5 h-full items-start">
          <div className="space-y-4 h-full">
            <div className="rounded-md border border-gray-200 bg-white text-gray-800 shadow-sm">
              <div className="md:flex items-start p-4 md:p-6 md:space-x-4">
                <Hospital className="text-[#E22026] w-8 h-8 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 cursor-pointer mb-1">
                    Medivisor India Treatment
                  </h3>
                  <p className="text-[#241d1f]">
                    Medivisor House 359, Sector 1, Vaishali, Ghaziabad, (Delhi/NCR) India
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-red-200 bg-white text-gray-800 shadow-lg overflow-hidden">
              <div className="bg-[#E22026] text-white p-3">
                <h3 className="text-2xl font-bold text-white cursor-pointer mb-0">
                  Our Global Offices
                </h3>
              </div>
              <div className="md:p-6 p-3">
                <ul className="text-[#241d1f] grid grid-cols-1 md:grid-cols-2 md:gap-x-8 gap-y-3 md:gap-y-6">
                  {offices.map((office, index) => (
                    <li key={index} className="flex items-start">
                      <Phone className="text-[#E22026] mr-3 mt-0.5 w-5 h-5 transform rotate-90" />
                      <div>
                        <strong className="text-[#E22026] font-semibold text-lg block mb-1">
                          {office.label}:
                        </strong>
                        {office.phone ? (
                          <a href={`tel:${office.phone}`} className="text-gray-800 hover:underline text-base">
                            {office.phone}
                          </a>
                        ) : (
                          office.phones?.map((phone, phoneIndex) => (
                            <a
                              key={phoneIndex}
                              href={`tel:${phone.split(' ')[0]}`}
                              className="text-gray-800 hover:text-[#E22026] transition duration-300 block text-base"
                            >
                              {phone}
                            </a>
                          ))
                        )}
                      </div>
                    </li>
                  ))}
                  <li className="flex items-start md:col-span-2">
                    <Mail className="text-[#E22026] mr-3 mt-0.5 w-5 h-5" />
                    <div>
                      <strong className="text-[#E22026] font-semibold text-lg block mb-1">Email:</strong>
                      <a
                        className="text-gray-800 hover:text-[#E22026] transition duration-300 block text-base"
                        href="mailto:info@medivisorhealth.com"
                      >
                        info@medivisorhealth.com
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-4xl mx-auto mt-5 md:mt-0">
            <div className="rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-gray-200 bg-[#E22026] text-white">
                <h3 className="text-2xl font-bold text-white cursor-pointer mb-0">
                  How can we help you?
                </h3>
              </div>
              
              <div className="md:p-6 m-3 pt-4">
                {submitStatus === 'success' && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span>Thank you! Your message has been sent successfully. Redirecting...</span>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Sorry, there was an error sending your message. Please try again.</span>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Full Name *" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="email" placeholder="Email Address *" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="tel" placeholder="WhatsApp Number *" {...field} />
                              </FormControl>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <span className="text-green-500">📱</span>
                                Include country code (e.g., +1234567890)
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-full md:w-1/2">
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Your Country *" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your health issue... *"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            {field.value?.length || 0}/500 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#77c047] text-white rounded-md hover:bg-green-700 transition font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-md overflow-hidden shadow-sm border border-gray-200 h-72">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.8047131916287!2d77.33048667550091!3d28.635614475663065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb00e7555807%3A0x6dee23139fc9b750!2sMedivisor%20House!5e0!3m2!1sen!2sin!4v1747405592425!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Medivisor House Location"
          />
        </div>
      </div>
    </section>
  );
}