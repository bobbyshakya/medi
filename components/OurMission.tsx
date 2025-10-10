"use client"

import type React from "react"
import { useState } from "react"
import {
  FaBullseye, // Solid icon for Mission
  FaEye, // Solid icon for Vision
  FaHeart, // Solid icon for Values
  FaUsers, // Solid icon for Approach
  FaGlobe, // Solid icon for Commitment
  FaAward, // Solid icon for Excellence
   // Already used for highlights
} from "react-icons/fa"
import { CheckCircle } from "lucide-react"

interface TabContent {
  id: string
  label: string
  icon: React.ReactNode
  title: string
  content: string
  highlights: string[]
}

const tabsData: TabContent[] = [
  {
    id: "mission",
    label: "Our Mission",
    icon: <FaBullseye className="w-6 h-6" />,
    title: "Our Mission",
    content:
      "To bridge the gap between international patients and India's world-class healthcare system, providing comprehensive support, transparent guidance, and compassionate care throughout every step of the medical journey.",
    highlights: [
      "Comprehensive patient support",
      "Transparent healthcare guidance",
      "World-class medical facilities",
      "End-to-end care coordination",
    ],
  },
  {
    id: "vision",
    label: "Our Vision",
    icon: <FaEye className="w-6 h-6" />,
    title: "Our Vision",
    content:
      "To become the most trusted global healthcare facilitator, making quality medical treatment accessible and affordable for patients worldwide while establishing India as the premier destination for medical tourism.",
    highlights: [
      "Global healthcare leadership",
      "Accessible quality treatment",
      "Affordable medical solutions",
      "Premier medical destination",
    ],
  },
  {
    id: "values",
    label: "Our Values",
    icon: <FaHeart className="w-6 h-6" />,
    title: "Our Core Values",
    content:
      "We are committed to excellence, integrity, and compassion in everything we do. Our values guide us in delivering exceptional healthcare experiences that transform lives and build lasting relationships.",
    highlights: [
      "Excellence in service delivery",
      "Integrity in all interactions",
      "Compassionate patient care",
      "Cultural sensitivity and respect",
    ],
  },
  {
    id: "approach",
    label: "Our Approach",
    icon: <FaUsers className="w-6 h-6" />,
    title: "Our Approach",
    content:
      "We believe in a patient-centric approach that combines cutting-edge medical technology with personalized care. Every treatment plan is tailored to individual needs, ensuring optimal outcomes and patient satisfaction.",
    highlights: [
      "Patient-centric methodology",
      "Personalized treatment plans",
      "Advanced medical technology",
      "Holistic care approach",
    ],
  },
  {
    id: "commitment",
    label: "Our Commitment",
    icon: <FaGlobe className="w-6 h-6" />,
    title: "Our Commitment",
    content:
      "We are dedicated to maintaining the highest standards of medical care while ensuring seamless coordination between patients, families, and healthcare providers across borders and cultures.",
    highlights: [
      "Highest medical standards",
      "Seamless care coordination",
      "Cross-cultural communication",
      "Family-centered support",
    ],
  },
  {
    id: "excellence",
    label: "Our Excellence",
    icon: <FaAward className="w-6 h-6" />,
    title: "Our Excellence",
    content:
      "Through continuous innovation and unwavering dedication to quality, we strive to exceed expectations and set new benchmarks in medical tourism and international patient care.",
    highlights: ["Continuous innovation", "Quality benchmarks", "Exceptional outcomes", "Industry leadership"],
  },
]

const ModernTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("mission")

  const activeContent = tabsData.find((tab) => tab.id === activeTab)

  return (
    <section className="py-12 md:py-10 bg-white font-sans">
      {" "}
      {/* Changed background to light gray for premium feel, increased padding */}
      <div className="container mx-auto ">
        {" "}
        {/* Increased max-width for content */}
        {/* Header */}
        <div className="text-center mb-12 md:mb-7">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {" "}
            {/* Larger, bolder heading */}
            Who We Are
          </h2>
          <p className="text-lg md:text-xl text-[#241d1f] max-w-3xl mx-auto leading-relaxed">
            {" "}
            {/* Adjusted font size and max-width */}
            Discover our unwavering commitment to transforming healthcare experiences through excellence, continuous
            innovation, and deeply compassionate care.
          </p>
        </div>
        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {" "}
          {/* Increased gap and margin-bottom */}
          {tabsData.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 transform 
                focus:outline-none focus:ring-2 cursor-pointer focus:ring-red-100 focus:ring-opacity-75
                ${
                  activeTab === tab.id
                    ? "bg-[#e12428] text-white shadow-lg" // Stronger shadow for active tab
                    : "bg-white text-[#241d1f] hover:text-white hover:bg-[#e12428] border border-gray-200 shadow-sm" // Darker text for inactive tabs, subtle shadow
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="container mx-auto ">
          {" "}
          {/* Increased max-width for content area */}
          <div className="bg-white  shadow-xs overflow-hidden border border-gray-100">
            {" "}
            {/* More pronounced shadow, rounded corners */}
            <div className="p-8 ">
              {" "}
              {/* Increased padding */}
              {activeContent && (
                <div className="animate-fadeIn">
                  {/* Main Content */}
                  <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
                    {" "}
                    {/* Increased gap */}
                    <div>
                      <div className="flex items-center gap-6 mb-4">
                        {" "}
                        {/* Increased gap and margin-bottom */}
                        <div className="p-5 bg-[#e12428] text-white rounded-2xl shadow-md flex-shrink-0">
                          {" "}
                          {/* Larger padding and shadow, flex-shrink-0 to prevent icon squishing */}
                          {activeContent.icon}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                          {" "}
                          {/* Larger, bolder title */}
                          {activeContent.title}
                        </h2>
                      </div>

                      <p className="text-lg text-gray-800 leading-relaxed mb-8">
                        {" "}
                        {/* Base font size to 18px (text-lg) and adjusted leading */}
                        {activeContent.content}
                      </p>

                      {/* Call to Action */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {" "}
                        {/* Increased gap */}
                        <button className="bg-[#e12428] text-white px-8 py-3 rounded-full font-medium text-base hover:bg-red-700 transition-colors duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300">
                          Learn More
                        </button>
                        <button className="border-2 border-[#e12428] text-[#e12428] px-8 py-3 rounded-full font-medium text-base hover:bg-[#e12428] hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300">
                          Contact Us
                        </button>
                      </div>
                    </div>
                    {/* Highlights */}
                    <div className="bg-gray-50 rounded-2xl p-8 md:p-10 shadow-inner">
                      {" "}
                      {/* Increased padding and added inner shadow */}
                      <h4 className="text-2xl font-bold text-gray-900 mb-6">Key Highlights</h4>{" "}
                      {/* Larger, bolder title */}
                      <div className="space-y-3">
                        {" "}
                        {/* Increased space between highlights */}
                        {activeContent.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start gap-3">
                            {" "}
                            {/* Increased gap, items-start for multi-line highlights */}
                            <div className="pt-1">
                              {" "}
                              {/* Adjust vertical alignment of icon */}
                               <CheckCircle className=" mr-2 text-[#74BF44] text-xl flex-shrink-0 mt-1" />{" "}
                              {/* Slightly larger bullet, flex-shrink-0 */}
                            </div>
                            <p className="text-lg text-gray-800 font-normal leading-relaxed">{highlight}</p>{" "}
                            {/* Base font size to 18px (text-lg) and adjusted leading */}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ModernTabs
