"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  UserRoundIcon as UserRoundMedical,
  Hospital,
  Globe,
  Heart,
  Smile,
  Stethoscope,
  MapPin,
  ThumbsUp,
} from "lucide-react"
import Image from "next/image"

export default function WhyChooseUsSection() {
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null)
  const [lastHoveredIndex, setLastHoveredIndex] = useState<number | null>(null)

  const stats = [
    {
      icon: <UserRoundMedical className="text-gray-800 w-10 h-10" />,
      value: "2,000+",
      label: "Patients Cared For",
      description: "Global patient success stories with expert-led care.",
      hoverIcon: <Smile className="text-gray-800 w-10 h-10" />,
      content: {
        title: "Expert Medical Professionals",
        paragraph:
          "Our internationally trained doctors deliver compassionate, patient-first care throughout every step of the treatment journey.",
        bullets: [
          "Globally certified medical experts",
          "Multilingual 24/7 patient assistance",
          "Tailored treatment plans",
        ],
        image: "/download.png",
      },
    },
    {
      icon: <Hospital className="text-gray-800 w-10 h-10" />,
      value: "100+",
      label: "Accredited Hospitals",
      description: "Partnered with world-class medical institutions.",
      hoverIcon: <Stethoscope className="text-gray-800 w-10 h-10" />,
      content: {
        title: "Global Hospital Network",
        paragraph:
          "Gain access to JCI & NABH accredited hospitals across India, equipped with the latest technology and global medical standards.",
        bullets: [
          "JCI & NABH certified facilities",
          "Advanced diagnostic & surgical units",
          "Dedicated case coordination team",
        ],
        image: "/Max-Super-Specialist-Hospital-Saket-New-Delhi.jpg",
      },
    },
    {
      icon: <Globe className="text-gray-800 w-10 h-10" />,
      value: "15+",
      label: "Countries Served",
      description: "Supporting cross-border care and travel.",
      hoverIcon: <MapPin className="text-gray-800 w-10 h-10" />,
      content: {
        title: "Cross-Border Patient Assistance",
        paragraph:
          "We serve patients from over 30 countries by simplifying travel, consultation, and follow-up for a stress-free medical journey.",
        bullets: [
          "Visa & travel documentation support",
          "Remote consultations available",
          "Comprehensive international assistance",
        ],
        image: "/high-angle-view-arrow-sign.jpg",
      },
    },
    {
      icon: <Heart className="text-gray-800 w-10 h-10" />,
      value: "95%+",
      label: "Satisfaction Rate",
      description: "Top-rated experiences by real patients.",
      hoverIcon: <ThumbsUp className="text-gray-800 w-10 h-10" />,
      content: {
        title: "Real Results. Real Trust.",
        paragraph:
          "With thousands of successful outcomes and transparent care practices, Medivisor is trusted by patients around the world.",
        bullets: ["High patient satisfaction", "Transparent billing practices", "Ongoing post-treatment support"],
        image: "/100-p.jpg",
      },
    },
  ]

  const defaultContent = {
    title: "Trusted Worldwide by Patients",
    paragraph:
      "Medivisor India Treatment connects you with India’s leading hospitals and doctors, offering affordable, safe, and personalized healthcare. From visa assistance to post-treatment care — your medical journey is in expert hands.",
    bullets: [
      "End-to-end medical concierge support",
      "No hidden charges or long waits",
      "24/7 guidance & second opinions",
      "Complete care before, during, and after treatment",
    ],
    image: "/100-p.jpg",
  }

  const contentToDisplay =
    activeCardIndex !== null
      ? stats[activeCardIndex].content
      : lastHoveredIndex !== null
      ? stats[lastHoveredIndex].content
      : defaultContent

  return (
    <section className="relative py-16 bg-gray-50 px-4 md:px-0">
      <div className="container mx-auto  relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center md:mb-7 mb-14"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#241d1f] mb-4">
            Why Choose <span className="text-[#241d1f]">Medivisor?</span>
          </h2>
          <p className="text-lg text-[#241d1f] max-w-2xl mx-auto">
            Discover why patients across the globe trust us for international medical care.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const isHovered = activeCardIndex === index
            return (
              <motion.div
                key={index}
                onMouseEnter={() => {
                  setActiveCardIndex(index)
                  setLastHoveredIndex(index)
                }}
                onMouseLeave={() => setActiveCardIndex(null)}
                className={`relative bg-white rounded-xs p-6 text-center border transition-all duration-300 ease-in-out cursor-pointer shadow-xs hover:shadow-xs
                  ${isHovered ? "border-gray-300" : "border-gray-200"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
             
              >
                <motion.div
                  className="mb-4 mx-auto text-center flex justify-center"
                  animate={{ scale: isHovered ? 1.15 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isHovered ? stat.hoverIcon : stat.icon}
                </motion.div>
                <h3 className="title-text">{stat.value}</h3>
                <p className="description mt-1">{stat.label}</p>
                <p className="description-1 mt-">{stat.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
