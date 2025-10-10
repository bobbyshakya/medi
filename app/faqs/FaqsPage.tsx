"use client";

import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Users, Heart, Clock, Shield, Plane, CreditCard, MapPin, Home, Stethoscope, HelpCircle, FileText, Calendar, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Banner from '@/components/BannerService';
import Ctasection from '@/components/CtaSection';
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What services do you provide?',
    answer: 'We assist patients from international countries in accessing affordable and hassle-free medical treatment in India. From hospital arrangements to hotel bookings and travel logistics, we are your one-stop solution for everything.',
    category: 'Services',
    icon: Heart
  },
  {
    id: '2',
    question: 'How many patients have you assisted so far?',
    answer: 'We have successfully assisted over 2000 patients from across the world.',
    category: 'Experience',
    icon: Users
  },
  {
    id: '3',
    question: 'What types of treatments do you offer?',
    answer: 'We arrange treatment for a wide range of medical issues, including those related to the brain, heart, liver, lungs, kidneys, spine, bones and joints, eyes, cancer, infertility, and more.',
    category: 'Treatments',
    icon: Stethoscope
  },
  {
    id: '4',
    question: 'How much does the treatment cost?',
    answer: 'The cost of treatment varies depending on your condition. Please send us your medical reports to receive a personalized quotation.',
    category: 'Pricing',
    icon: CreditCard
  },
  {
    id: '5',
    question: 'Which part of India do you organize the treatment in?',
    answer: 'Primarily in New Delhi. However, if you have a preference for another city, let us know, and we will arrange everything in that location.',
    category: 'Location',
    icon: MapPin
  },
  {
    id: '6',
    question: 'How does the process work?',
    answer: `It's very simple:

I. Get a quote: Send us your medical reports, and we'll provide a quotation that includes a treatment plan and the overall cost, including treatment, travel, accommodation, and food.

II. Talk to the doctor: Let us know if you'd like to speak with the doctor, and we'll connect you with the appropriate specialist to discuss the treatment plan and expected outcomes.

III. Book a ticket: Send us these documents, and we'll arrange your visa. You can then book your flight, or if you prefer, we can book it for you. Depending on your condition, you may need flying clearance from the airline, which your travel agent can help arrange.

IV. Fly to India: Once you arrive in India, we handle everything else, including airport pickup, hotel accommodations, hospital visits, currency exchange, and local SIM cards. A dedicated staff member will assist you throughout your stay.`,
    category: 'Process',
    icon: Clock
  },
  {
    id: '7',
    question: 'What if I don\'t have medical reports?',
    answer: 'If you don\'t have medical reports, don\'t worry. While having them helps us give a more accurate quote and treatment plan, you can still travel to India for treatment. Once you arrive, we\'ll conduct the necessary investigations before advising on the best course of action. It\'s important not to delay your visit as even a small delay could worsen your condition.',
    category: 'Requirements',
    icon: FileText
  },
  {
    id: '8',
    question: 'What if I don\'t have a passport?',
    answer: 'A passport is essential. You can apply for it under a medical emergency quota to expedite the process.',
    category: 'Requirements',
    icon: Shield
  },
  {
    id: '9',
    question: 'How quickly can everything be arranged?',
    answer: 'If everything is in order, we can organize your travel and treatment within a week.',
    category: 'Timeline',
    icon: Calendar
  },
  {
    id: '10',
    question: 'Can I travel without an attendant?',
    answer: 'Yes, if your medical condition allows. We will take care of you once you arrive in India.',
    category: 'Travel',
    icon: Plane
  },
  {
    id: '11',
    question: 'Will there be anyone to pick me up from the airport?',
    answer: 'Yes, a team member will meet you at the airport and escort you to your hotel free of charge. They will also assist with getting a SIM card and currency exchange.',
    category: 'Support',
    icon: Headphones
  },
  {
    id: '12',
    question: 'How far is the hotel from the airport?',
    answer: 'The hotel is about 30-40 minutes from the airport.',
    category: 'Location',
    icon: MapPin
  },
  {
    id: '13',
    question: 'How far is the hospital from the hotel?',
    answer: 'The hospital is just a two-minute walk or drive from the hotel.',
    category: 'Location',
    icon: MapPin
  },
  {
    id: '14',
    question: 'How will I commute between the hotel and the hospital?',
    answer: 'Our transport will pick you up and bring you back.',
    category: 'Transport',
    icon: Plane
  },
  {
    id: '15',
    question: 'Will someone from your team be with me at the hospital?',
    answer: 'Yes, a team member will accompany you to all hospital visits, helping with consultations, investigations, admissions, discharges, and follow-ups.',
    category: 'Support',
    icon: Headphones
  },
  {
    id: '16',
    question: 'Can my attendant stay with me in the hospital?',
    answer: 'Yes, your attendant can stay with you in the hospital, even during ICU stays. We provide a private room and all meals (breakfast, lunch, and dinner) for your attendant free of charge.',
    category: 'Support',
    icon: Heart
  },
  {
    id: '17',
    question: 'Can my attendant undergo a health check anytime during the trip?',
    answer: 'Yes, the attendant can have a health check-up. In fact, it\'s a good idea, as it provides insight into their health and identifies any areas needing special attention. We offer health check-up packages starting at 50 USD.',
    category: 'Services',
    icon: Stethoscope
  },
  {
    id: '18',
    question: 'When do I need to make the payment? How can I pay?',
    answer: 'You can make the payment after the treatment. Payment can be made via bank transfer, debit/credit card, or cash.',
    category: 'Payment',
    icon: CreditCard
  },
  {
    id: '19',
    question: 'Can I get an apartment to self-cook? How far is the grocery shop?',
    answer: 'Yes, you can choose from various apartment options, including 1BHK, 2BHK, and 3BHK units, costing between 20 to 50 USD per day. Grocery shops are just a one-minute walk away and also offer home delivery services.',
    category: 'Accommodation',
    icon: Home
  },
  {
    id: '20',
    question: 'Can you arrange for sightseeing during my trip?',
    answer: 'Yes, we can arrange sightseeing trips. We also offer a complimentary trip to the Taj Mahal for all our patients.',
    category: 'Services',
    icon: Heart
  },
  {
    id: '21',
    question: 'Will a drop-off at the airport be provided?',
    answer: 'Yes, a team member will escort you back to the airport free of charge.',
    category: 'Support',
    icon: Plane
  },
  {
    id: '22',
    question: 'Can I receive medicines in my home country if needed?',
    answer: 'Yes, we can send the medicines through a courier or with other returning patients.',
    category: 'Support',
    icon: Heart
  },
  {
    id: '23',
    question: 'Can an online review with the doctor be organized if needed?',
    answer: 'Yes, a Zoom call can be arranged with the treating doctor at no additional facilitation fee for up to two sessions.',
    category: 'Support',
    icon: MessageCircle
  }
];

const categoryIcons: Record<string, React.ElementType> = {
  'Services': Heart,
  'Experience': Users,
  'Treatments': Stethoscope,
  'Pricing': CreditCard,
  'Location': MapPin,
  'Process': Clock,
  'Requirements': FileText,
  'Timeline': Calendar,
  'Travel': Plane,
  'Support': Headphones,
  'Transport': Plane,
  'Payment': CreditCard,
  'Accommodation': Home
};

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const faqSectionRef = useRef<HTMLDivElement>(null);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);

    // Smooth scroll to FAQ section on mobile/tablet or when needed
    if (faqSectionRef.current) {
      const headerHeight = 80; // Account for any fixed header
      const elementPosition = faqSectionRef.current.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const filteredFAQs = selectedCategory === 'All'
    ? faqData
    : faqData.filter(item => item.category === selectedCategory);

  const getCategoryCount = (category: string) => {
    return category === 'All'
      ? faqData.length
      : faqData.filter(item => item.category === category).length;
  };

  return (
    <div className="min-h-screen px-2 md:px-0 bg-gray-50">
      {/* Header Section */}
      <Banner
        topSpanText="FAQs"
        title="All You Need to Know Before Your Treatment in India"
        description="Have Questions? We know you may have queries about travelling to India for medical treatment. To support you, we’ve put together a list of Frequently Asked Questions (FAQs) covering everything from hospital options and treatment planning to travel, accommodation, and post-treatment care. Most of the answers you need can be found below — helping you prepare with confidence and peace of mind. If your specific question isn’t listed, please don’t worry. Simply contact our team, and we’ll be happy to guide you step by step."
        buttonText="Enquire Now"
        buttonLink="/contact"
        bannerBgImage="/faq-banner.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Expert Medical Cost Advisors at Medivisor India"
      />
      {/* Main Content */}
      <div className=" container mx-auto  py-10">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Left Sidebar - Categories */}
          <div className="lg:w-80 md:order-1 order-2 flex-shrink-0">
            <div className="bg-white rounded-xs shadow-xs border border-gray-50 sticky top-6">
              <div className="p-6 border-b border-gray-100">
                <h2 className="heading-lg">Categories</h2>
                <p className="description">Browse questions by topic</p>
              </div>

              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className={`w-full flex items-center text-lg justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${selectedCategory === 'All'
                        ? 'bg-gray-50 text-[#241d1f] border border-gray-100'
                        : 'text-[#241d1f] hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCategory === 'All' ? 'bg-white' : 'bg-white'
                        }`}>
                        <HelpCircle className={`w-5 h-5 ${selectedCategory === 'All' ? 'text-[#241d1f]' : 'text-[#241d1f]'
                          }`} />
                      </div>
                      <span className="description">All Questions</span>
                    </div>
                    <Badge variant="secondary" className={`${selectedCategory === 'All'
                        ? 'bg-text-100 text-[#241d1f]'
                        : 'bg-gray-100 text-[#241d1f]'
                      }`}>
                      {getCategoryCount('All')}
                    </Badge>
                  </button>

                  <Separator className="my-2" />

                  {categories.map(category => {
                    const Icon = categoryIcons[category] || HelpCircle;
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full flex items-center justify-between border-b px-4 py-3 border-gray-100 text-left transition-all duration-200 ${selectedCategory === category
                            ? 'bg-gray-50 text-[#241d1f] border border-gray-200'
                            : 'text-[#241d1f] hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xs flex items-center justify-center ${selectedCategory === category ? 'bg-gray-100' : 'bg-gray-100'
                            }`}>
                            <Icon className={`w-5 h-5 ${selectedCategory === category ? 'text-[#241d1f]' : 'text-[#241d1f]'
                              }`} />
                          </div>
                          <span className="description">{category}</span>
                        </div>
                        <Badge variant="secondary" className={`${selectedCategory === category
                            ? 'bg-gray-100 text-[#241d1f]'
                            : 'bg-gray-100 text-[#241d1f]'
                          }`}>
                          {getCategoryCount(category)}
                        </Badge>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Right Content - FAQ Items */}
          <div className="flex-1 order-1 md:order-2 pt-10" ref={faqSectionRef}>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="heading-lg">
                    {selectedCategory === 'All' ? 'All Questions' : selectedCategory}
                  </h2>
                  <p className="description">
                    {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.map((item) => {
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
                          {/* <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className="text-base text-red-600 font-normal border-red-100 bg-red-50"
                            >
                              {item.category}
                            </Badge>
                          </div> */}
                          <h3 className="description">
                            {item.question}
                          </h3>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4 mt-1">
                        <div className={`w-8 h-8 rounded-xs flex items-center justify-center transition-colors duration-200 ${isOpen ? 'bg-gray-100' : 'bg-gray-100'
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
        </div>
      </div>
      <Ctasection />
    </div>
  );
}