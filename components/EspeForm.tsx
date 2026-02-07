// components/EspeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitMedivisorForm } from '@/app/api/submit-espe/route';

export default function MedivisorForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Get form values
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const whatsapp = formData.get('whatsapp') as string;
      const background = formData.get('background') as string;
      const message = formData.get('message') as string || '';

      // Transform to match submitMedivisorForm structure
      const data = {
        fullName: name,
        applicantType: 'individual',
        contactPerson: name,
        phone: whatsapp, // Use WhatsApp as the primary phone
        whatsapp: whatsapp,
        email: email,
        address: '',
        city: '',
        background: background,
        backgroundDescription: '',
        yearsWorking: '1-3',
        motivation: message || 'No motivation provided',
        experience: '',
        hasOffice: 'false',
        officeLocation: '',
        hasSmartphone: true,
        hasWhatsapp: true,
        hasEmail: true,
        hasInternet: true,
        serviceArea: 'local',
        agreeTerms: true,
        signatureName: name,
        signatureDate: new Date().toISOString().split('T')[0],
      };

      // Default attachments
      const attachments = {
        idProof: false,
        cv: false,
        orgRegistration: false,
        reference: false,
      };

      // Call server action
      const result = await submitMedivisorForm(data, attachments);

      if (result && result.ok) {
        router.push('/thank-you');
      } else {
        setError(result?.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sticky md:top-20 rounded-xl bg-white p-4 shadow-xs border border-gray-100">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            Join Our Programme
          </h3>
        </div>
        <p className="text-gray-600 text-sm">
          Fill in the form and we will connect with you soon.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
        {[
          { id: "name", name: "name", label: "Full Name", type: "text", placeholder: "Enter your full name", required: true },
          { id: "email", name: "email", label: "Email Address", type: "email", placeholder: "Enter your email address", required: true },
          { id: "whatsapp", name: "whatsapp", label: "WhatsApp Number", type: "tel", placeholder: "Enter WhatsApp number", required: true }
        ].map((field) => (
          <div key={field.id}>
            <input
              type={field.type}
              id={field.id}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors text-sm"
              autoComplete={field.type === "email" ? "email" : "on"}
              disabled={isSubmitting}
            />
          </div>
        ))}

        {/* Dropdown */}
        <div>
          <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-1">
            Background/Experience <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="background"
              name="background"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors appearance-none text-sm bg-white"
              disabled={isSubmitting}
            >
              <option value="">Select your background</option>
              <option value="medical">Medical/Healthcare</option>
              <option value="social">Social Work</option>
              <option value="community">Community Leadership</option>
              <option value="business">Business/Entrepreneurship</option>
              <option value="other">Other</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Why do you want to join?
            <span className="text-gray-500 font-normal ml-1">(Optional)</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Share your motivation briefly..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 transition-colors resize-none text-sm"
            maxLength={300}
            disabled={isSubmitting}
          />
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500">
              Maximum 300 characters
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-[#E22026] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#E22026] focus:ring-offset-2 text-sm ${
              isSubmitting 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-[#c41e24] active:bg-[#b31c20]'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            By submitting, you agree to our terms and privacy policy.
          </p>
        </div>
      </form>
    </div>
  );
}
