"use client";

import type React from "react";
import { useRef } from "react";
import {
  Shield,
  MessageCircle,
  DollarSign,
  Package,
  HeartHandshake,
  Star,
  CheckCircle,
  Heart,
  UserCheck,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Banner from "@/components/BannerService";
import CtaSection from "@/components/CtaSection";
import WhyChooseUsSection from "@/components/StatsSection";
import WhyMedvisor from '@/components/whyMedivosor'
import { motion } from "framer-motion";

interface ChoiceReason {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  highlights?: string[];
}

const choiceReasons: ChoiceReason[] = [
  {
    id: "1",
    title: "Top-notch Healthcare Providers",
    description:
      "Collaborating exclusively with JCI and NABH accredited healthcare institutions and clinicians in India, Medivisor ensures that patients receive treatments and services of the highest quality, adhering to international healthcare standards.",
    icon: Shield,
    highlights: ["JCI Accredited", "NABH Certified", "International Standards"],
  },
  {
    id: "2",
    title: "Tailored Treatment Plans",
    description:
      "Committed to personalized healthcare solutions, Medivisor works closely with medical experts to customize treatment plans based on the specific needs and preferences of each patient, enhancing the overall quality of care.",
    icon: UserCheck,
    highlights: ["Personalized Care", "Expert Collaboration", "Custom Solutions"],
  },
  {
    id: "3",
    title: "Clear and Open Communication",
    description:
      "Communication is at the core of the Medivisor experience. We prioritize transparency throughout the medical journey, covering treatment options, costs, and expected outcomes. This approach ensures that you are well-informed, empowering you to make decisions with confidence.",
    icon: MessageCircle,
    highlights: ["Full Transparency", "Informed Decisions", "Clear Communication"],
  },
  {
    id: "4",
    title: "Affordable Healthcare Options",
    description:
      "Recognizing the importance of affordability in healthcare, Medivisor strives to offer safe, accessible, and truly cost-effective treatment options worldwide, ensuring dignity and equality for patients, without compromising on quality or patient care, and building trust with every treatment journey.",
    icon: DollarSign,
    highlights: ["Cost-Effective", "Quality Maintained", "Budget-Friendly"],
  },
  {
    id: "5",
    title: "One-Stop Shop – Streamlined Experience",
    description:
      "Medivisor provides a seamless and stress-free experience by managing everything from hospital booking to hotel accommodation, visa arrangements, and travel logistics. Eliminating the need to search for separate vendors, all services are efficiently provided under one roof.",
    icon: Package,
    highlights: ["All-in-One Service", "No Multiple Vendors", "Complete Management"],
  },
  {
    id: "6",
    title: "Comprehensive Assistance in India",
    description:
      "Going beyond paperwork, Medivisor ensures a hassle-free experience with a dedicated executive present both inside and outside the hospital. From airport pick-ups to hospital transfers and assisting you during treatment, we make the process seamless.",
    icon: HeartHandshake,
    highlights: ["Dedicated Executive", "Full Assistance", "Hospital Accompaniment"],
  },
  {
    id: "7",
    title: "Holistic Care – Embracing Life's Moments",
    description:
      "Medivisor believes in extending care beyond the clinic. We organize and facilitate patients to enjoy festivals and significant occasions, contributing to emotional well-being and recovery.",
    icon: Heart,
    highlights: ["Beyond Medical Care", "Festival Celebrations", "Recovery Activities"],
  },
  {
    id: "8",
    title: "Continued Relationship – Post-Treatment Support",
    description:
      "Our commitment doesn't end with treatment. We continue to assist even after patients return home, with follow-ups, medicine delivery, and video consultations.",
    icon: Clock,
    highlights: ["Post-Treatment Care", "Medicine Delivery", "Follow-up Support"],
  },
  {
    id: "9",
    title: "1800+ Testimonials – Real Stories, Real Satisfaction",
    description:
      "Over 1500 international patients, including 1200 from Pacific Island countries, have chosen Medivisor and shared their positive experiences.",
    icon: Star,
    highlights: ["1500+ Patients", "1200 Pacific Islands", "Proven Results"],
  },
];

export default function WhyChooseUsPage() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToCard = (index: number) => {
    if (cardRefs.current[index]) {
      cardRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Banner
        topSpanText="Why Choose Medivisor?"
        title="Your Partner for Clear, Confident Healthcare Decisions"
        description="At Medivisor India, we simplify complex medical choices by connecting you with leading hospitals and specialists. Our expert guidance, transparent cost breakdowns, and personalized support ensure a smooth, stress-free treatment journey—so you can focus on healing."
        buttonText="Speak with a Medivisor Expert"
        buttonLink="/contact"
        bannerBgImage="/faq-banner.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Trusted Medical Experts at Medivisor India"
      />

      <WhyChooseUsSection />
      <WhyMedvisor />

      <section className="bg-gray-50 p-8">
        <div className="container mx-auto px-4 lg:px-8">
          <header className="mb-6 text-center">
            <h2 className="heading-lg mb-0">
              Our Strengths
            </h2>
            <p className="description">
              {choiceReasons.length} reasons why Medivisor stands out
            </p>
          </header>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr">
            {choiceReasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <motion.div
                  key={reason.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}
                  onClick={() => scrollToCard(index)}
                  className="flex flex-col"
                >
                  <Card className="bg-white border border-gray-100 shadow-xs rounded-xs cursor-pointer transition-all h-full">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xs mb-3">
                          <Icon className="w-6 h-6 text-[#241d1f]" />
                        </div>
                        <h3 className="title-text mb-1">
                          {reason.title}
                        </h3>
                        <p className="description text-[#241d1f]">
                          {reason.description}
                        </p>
                      </div>

                      {reason.highlights && (
                        <div className="flex mt-4 flex-wrap gap-2">
                          {reason.highlights.map((highlight, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-gray-50 text-sm font-medium border-gray-100 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-[#74BF44]" />
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
        <CtaSection />
      </section>
    </>
  );
}