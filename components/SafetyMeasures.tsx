'use client';

import { useState } from 'react';
import { Hospital, Ambulance, HeartHandshake, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SafetyMeasures() {
  const [activeTab, setActiveTab] = useState('hospital');

  const tabs = [
    { id: 'hospital', label: 'Hospital', icon: <Hospital className="w-4 h-4" /> },
    { id: 'emergency', label: 'Emergency', icon: <Ambulance className="w-4 h-4" /> },
    { id: 'care', label: 'Care', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'information', label: 'Information', icon: <Info className="w-4 h-4" /> }
  ];

  const tabContent = {
    hospital: {
      title: "Where you are treated matters – we make no compromises.",
      cards: [
        {
          title: "Verified Hospitals & Trusted Doctors",
          description:
            "At Medivisor, we partner only with hospitals and doctors who meet the highest standards of global healthcare safety, ethics, and clinical excellence.",
          details: [
            "Super-speciality tertiary care facilities",
            "Accredited by JCI, AACI, or NABH",
            "350+ beds for multi-specialty management",
            "Centrally located in major cities and medical hubs"
          ]
        },
        {
          title: "Hygiene & Infection Control Vigilance",
          description:
            "We proactively monitor infection control standards at our partner hospitals to ensure a safe and sterile environment for every patient.",
          details: [
            "Proper sterilization of surgical tools and equipment",
            "Strict compliance with staff hygiene protocols, including PPE",
            "Daily inspections for cleanliness in patient rooms, ICUs, and waiting areas"
          ]
        }
      ]
    },
    emergency: {
      title: "We don't wait for help to arrive. We bring it to you.",
      cards: [
        {
          title: "Rapid Emergency Response",
          description:
            "Emergencies require speed, clarity, and coordination—and that's exactly what our system delivers.",
          details: [
            "24/7 Emergency SOS Group created for each patient on WhatsApp and Viber",
            "All accommodations booked within 500 meters of both hospital and our office",
            "Round-the-clock paramedic team trained to respond within minutes"
          ]
        }
      ]
    },
    care: {
      title: "Care doesn't end at the hospital door – it travels with the patient.",
      cards: [
        {
          title: "Continuous Medical Oversight",
          description:
            "Every patient case is continuously supervised by our in-house clinical team.",
          details: [
            "Coordinate and communicate with treating specialists",
            "Review test results, prescriptions, and case notes",
            "Offer a second medical opinion whenever required"
          ]
        },
        {
          title: "Daily Nurse Visits at Accommodation",
          description:
            "Our registered nurses make daily visits to patients' hotels or apartments.",
          details: [
            "Ensure medications are taken on time and in the correct dose",
            "Monitor vital signs like blood pressure, temperature, and oxygen levels",
            "Examine surgical sites for signs of infection or delayed healing"
          ]
        }
      ]
    },
    information: {
      title: "Informed patients make safer choices.",
      cards: [
        {
          title: "Patient Education & Informed Decision-Making",
          description:
            "We actively keep the patient and their family informed at every stage, ensuring they are empowered to make safe, confident choices.",
          details: [
            "Clear explanation of diagnosis, treatment options, and timelines",
            "Disclosure of risks, side effects, and alternatives",
            "Real-time progress updates on the treatment plan",
            "A practical list of Do's and Don'ts during recovery, diet, movement, and hygiene"
          ]
        }
      ]
    }
  };

  const cards = tabContent[activeTab as keyof typeof tabContent].cards;
  const isTwoCards = cards.length === 2;

  return (
    <section className="md:py-10 py-10 bg-gray-50 px-2 md:px-0 overflow-hidden">
      <div className="container mx-auto ">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="heading-lg">
            Our Patient Safety Measures
          </h2>
          <p className="description md:max-w-3xl mx-auto px-2">
            At Medivisor, patient safety isn’t just a protocol — it’s our promise. From the moment you arrive until the day you return home, every step of your medical journey is safeguarded with robust systems, dedicated care, and unwavering attention to detail.
          </p>
        </div>

        {/* Tabs */}
        <div className="md:bg-white rounded-xs md:shadow-xs md:p-6">
          {/* Mobile Scrollable Tabs */}
          <div className="flex md:hidden overflow-x-auto gap-3 pb-3 mb-6 -mx-2 px-2 scrollbar-hide">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="outline"
                size="sm"
                className={`flex items-center text-sm md:text-lg gap-2 px-4 py-2 whitespace-nowrap rounded-full border transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-[#241d1f] border-gray-200 hover:bg-red-50'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex flex-wrap justify-center border-b border-gray-200 mb-8">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={`py-3 px-6 text-lg md:text-lg font-semibold border-b-4 rounded-none transition-all ${activeTab === tab.id
                    ? 'text-red-600 border-red-600'
                    : 'text-[#241d1f] border-transparent hover:text-red-600'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="tab-content-container bg-white p-4 overflow-y-auto max-h-[500px]">
            <h2 className="title-heading border-b md:border-none pb-2 border-gray-200 mb-6 text-center">
              {tabContent[activeTab as keyof typeof tabContent].title}
            </h2>

            <div
              className={`${isTwoCards
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'
                  : 'flex flex-col gap-6'
                }`}
            >
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md md:border md:border-gray-100 p-0 sm:p-6 hover:shadow-md transition-all"
                >
                  <h3 className="title-text ">
                    {card.title}
                  </h3>
                  <p className="description my-4">
                    {card.description}
                  </p>
                  <ul className="space-y-2 description">
                    {card.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <span className="text-[#4CAF50] font-bold mt-1">✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
