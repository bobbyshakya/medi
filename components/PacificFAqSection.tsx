// Updated components/FAQSection.tsx - Sidebar removed, full-width FAQ list
"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Stethoscope, Clock, CreditCard, FileText, MessageCircle, Plane, MapPin, Users, Headphones, Heart } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

interface FAQSectionProps {
  faqSectionRef: React.RefObject<HTMLDivElement>;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What will happen during the consultation?',
    answer: 'Our team will review your symptoms and reports, assess your condition, and guide you on the best treatment options available in India — including estimated costs, hospital choices, and recovery timelines.',
    category: 'Consultation',
    icon: Stethoscope
  },
  {
    id: '2',
    question: 'How much does the consultation cost?',
    answer: 'The consultation fee is 25 USD (or 100 PGK / 200 SBD / 2500 Vatu / 50 FJD) per person, payable on the spot during your appointment.',
    category: 'Consultation',
    icon: CreditCard
  },
  {
    id: '3',
    question: 'How can I register?',
    answer: 'Simply fill out the registration form or contact your local Medivisor representative for assistance.',
    category: 'Registration',
    icon: FileText
  },
  {
    id: '4',
    question: 'What happens after registration?',
    answer: 'You will receive a confirmation call from our team to confirm your appointment time and venue details.',
    category: 'Registration',
    icon: MessageCircle
  },
  {
    id: '5',
    question: 'Do I need to bring any medical reports?',
    answer: 'Yes. Please bring your latest eye test reports, prescription glasses, and any related medical documents. These help the doctor understand your condition more accurately.',
    category: 'Requirements',
    icon: FileText
  },
  {
    id: '6',
    question: 'What if I need surgery or advanced treatment?',
    answer: 'If surgery or advanced care is required, Medivisor will assist you with hospital selection, travel arrangements, visa guidance, and estimated treatment costs in India.',
    category: 'Treatment',
    icon: Plane
  },
  {
    id: '7',
    question: 'Is treatment done locally or in India?',
    answer: 'The consultation will take place locally, but treatment (if needed) will be arranged in India. You may choose from our empanelled hospitals or let us know your preferred hospital, and we’ll coordinate accordingly.',
    category: 'Treatment',
    icon: MapPin
  },
  {
    id: '8',
    question: 'Can I bring a family member with me?',
    answer: 'Absolutely! You’re welcome to bring a family member or friend along for support during your consultation.',
    category: 'Consultation',
    icon: Users
  },
  {
    id: '9',
    question: 'Will there be follow-up support after the consultation?',
    answer: 'Yes. Our Medivisor team will stay in touch to guide you through the next steps — including travel planning, hospital arrangements, and post-treatment support.',
    category: 'Support',
    icon: Headphones
  },
  {
    id: '10',
    question: 'Why should I choose India for my treatment?',
    answer: 'India offers world-class healthcare, highly experienced doctors, advanced technology, and affordable treatment options — often at a fraction of the cost compared to many other countries.',
    category: 'Treatment',
    icon: Heart
  }
];

export default function FAQSection({ faqSectionRef }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="w-full bg-gray-50 p-4" ref={faqSectionRef}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-[#241d1f]"> Frequently Asked Questions (FAQs)</h2>
            <p className="description">
              {faqData.length} question{faqData.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Items - Full width */}
      <div className="space-y-4">
        {faqData.map((item) => {
          const Icon = item.icon;
          const isOpen = openItems.includes(item.id);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xs shadow-xs border border-gray-50 overflow-hidden hover:shadow-sm transition-all duration-300"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-5 text-left flex items-start justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0 md:block hidden mt-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-xs flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#241d1f]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="description">
                      {item.question}
                    </h3>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4 mt-1">
                  <div className={`w-8 h-8 rounded-xs flex items-center justify-center transition-colors duration-200 ${
                    isOpen ? 'bg-gray-100' : 'bg-gray-100'
                  }`}>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#241d1f]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#241d1f]" />
                    )}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-1 duration-300">
                  <div className="md:ml-14 pt-2 border-t border-gray-100">
                    <div className="pt-4">
                      {item.answer.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="description">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}