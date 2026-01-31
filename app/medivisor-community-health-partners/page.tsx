'use client';

import MedivisorForm from "@/components/EspeForm";
import { MapPin } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <section className="relative w-full h-[88vh] overflow-hidden text-white">
                {/* Background image */}
                <img
                    src="/PNG-Web-Banner.png"
                    alt="Medivisor Community Health Partners"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Logo */}
                <div className="absolute top-0 left-6 md:left-20 z-40">
                    <img src="/icon/Whale-logo.png" className="w-14 md:w-28" />
                </div>

                {/* RIGHT side text */}
                <div className="relative z-30 flex h-full items-start mt-20 justify-end">
                    <div className="w-[44%] px-6 md:pl-20 text-left">
                        <p className="mb-2 inline-flex items-center gap-2 text-base md:text-xl font-medium">
                            <MapPin className="w-5 h-5 text-white" />
                            Papua New Guinea
                        </p>

                        <h1 className="text-3xl md:text-[40px] font-medium leading-tight">
                            Medivisor Expanded Patient Support Programme
                        </h1>

                        <p className="mt-3 text-sm md:text-base text-gray-200">
                            Helping Patients. Guiding Families. Saving Lives.
                        </p>
                    </div>
                </div>

                {/* 🔻 Bottom-right INDIA white box */}
                <div className="absolute bottom-6 right-6 z-40">
                    <div className="flex items-center gap-3 bg-white text-black px-2 py-2 rounded-sm shadow-xs">
                        <img src="/icon/flag/png.png" className="w-14 h-10 object-cover" />
                        <img src="/icon/flag/airplane.png" className="w-10 h-10 object-contain" />
                        <img src="/icon/flag/india.png" className="w-14 h-10 object-cover" />
                    </div>
                </div>
            </section>





            {/* Main Content */}
            <div className="mx-auto container ">
                <div className="grid gap-6 py-12 lg:grid-cols-4">
                    {/* Left Column - Content Sections */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Section 1: An Invitation to Serve */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    An Invitation to Serve
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    Over the last one year, Medivisor India Treatment has walked alongside more than a hundred families from Papua New Guinea and helped them access life-changing treatment in India. Behind every number is a human story — a mother, a father, a child — and a family that was once afraid, confused, and searching for hope.
                                </p>
                                <p>
                                    As awareness grows, we are receiving an overwhelming number of calls and messages. This clearly shows that many more people in Papua New Guinea are suffering quietly and do not know where to turn for help.
                                </p>
                                <p>
                                    While digital platforms have helped us reach many families, we also recognize a difficult reality: many of our countrymen are not online or are not comfortable using technology. As a result, they continue to struggle in silence — not because help does not exist, but because they cannot reach it.
                                </p>
                                <p>
                                    To address this gap, Medivisor has launched the Expanded Patient Support Programme (EPSP). This programme is designed to reach villages, churches, and local communities and ensure that no one is left behind simply because they cannot connect digitally.
                                </p>
                                <p className="pt-6">
                                    Since Medivisor alone cannot go deep and wide, we now invite compassionate, service-minded individuals and organizations across Papua New Guinea to join hands with us as:
                                </p>
                                <div className="mt-4 p-4 bg-[#E22026]/10 rounded-lg ">
                                    <p className="text-lg font-semibold text-gray-900">
                                        Medivisor Community Health Partners
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        (Publicly recognised as Medivisor Health Ambassadors)
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Who We Are */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Who We Are
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    Medivisor India Treatment is a patient guidance and medical support organization based in New Delhi, India. For more than ten years, we have helped patients from Papua New Guinea, Fiji, Vanuatu, Solomon Islands, and other countries access safe, ethical, and affordable medical treatment in India.
                                </p>
                                <div className="p-4  rounded-lg border border-blue-100">
                                    <p className="font-semibold text-gray-900">
                                        We do not merely coordinate treatment. We walk with patients and families like family — from their first question until their safe return home.
                                    </p>
                                </div>
                                <p className="font-semibold text-gray-900 mt-6">Our Services Include:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {[
                                        "Hospital and doctor selection",
                                        "Treatment planning with transparent costing",
                                        "Visa, travel, and logistics support",
                                        "Accommodation and local transport in India",
                                        "On-ground patient care and coordination",
                                        "Post-treatment follow-up support"
                                    ].map((service, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700">{service}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="pt-6">
                                    To date, Medivisor has assisted over 2,500 international patients and has built a strong reputation for ethics, transparency, patient safety, and compassionate care.
                                </p>
                            </div>
                        </section>

                        {/* Section 3: What Is This Programme About? */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    What Is This Programme About?
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900">
                                    The Medivisor Expanded Patient Support Programme (EPSP) is a community-based initiative created to:
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        "Provide trusted guidance to patients and families",
                                        "Help them reach the right doctors and hospitals",
                                        "Protect them from wrong advice and wasted money",
                                        "Support them throughout the entire treatment journey"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="font-semibold text-gray-900 mt-6">A Medivisor Community Health Partner Is:</p>
                                <ul className="space-y-3">
                                    {[
                                        "A guide for patients",
                                        "A support system for families",
                                        "A bridge between the community and reliable treatment",
                                        "A trusted local point of contact"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="font-semibold text-gray-900 text-lg">
                                        You are not an agent. You are not a broker.
                                    </p>
                                    <p className="mt-2 text-gray-700">
                                        You are a community health guide and support person.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: What You Will Do */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    What You Will Do
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    As a Medivisor Community Health Partner and Health Ambassador, you are not just performing a role — you are serving a purpose.
                                </p>
                                <p className="font-semibold text-gray-900 mt-4">You will:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {[
                                        "Meet and listen to patients and their families",
                                        "Help collect and organize medical reports",
                                        "Arrange online consultations with doctors in India",
                                        "Guide patients through documentation and travel processes",
                                        "Stay connected with families throughout the treatment journey",
                                        "Act as their local support and guidance point"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 5: How Medivisor Supports You */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    How Medivisor Supports You
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900">Medivisor India will:</p>
                                <ul className="space-y-3">
                                    {[
                                        "Review and guide all medical cases",
                                        "Connect patients to the right hospitals and doctors",
                                        "Plan and manage treatment in India",
                                        "Handle hospital coordination, stay, and local support",
                                        "Provide training, guidance, and working materials",
                                        "Stand with you in every patient case"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-green-100">
                                    <p className="font-semibold text-gray-900">
                                        You are never alone in this journey.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 6: Sustainability */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Sustainability
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    To help Community Health Partners serve patients full-time and continue this work sustainably, Medivisor provides a simple and transparent support structure per patient.
                                </p>
                                <div className="flex items-center space-x-4 my-4">
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        </div>
                                        <span className="text-gray-700">Not commission-driven</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                        </div>
                                        <span className="text-gray-700">Not sales-based</span>
                                    </div>
                                </div>
                                <p>
                                    It is a dignified and ethical system designed to keep this service alive and accessible.
                                </p>
                            </div>
                        </section>

                        {/* Section 7: Who Can Join? */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Who Can Join?
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900">
                                    We welcome individuals and organizations who:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {[
                                        "Are socially motivated and respected in their community",
                                        "Have a service-oriented mindset",
                                        "Preferably have medical or social sector exposure",
                                        "Believe in ethical, patient-first work",
                                        "Value blessings, goodwill, and long-term respect over money",
                                        "Want to build something meaningful for their community"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 8: What Health Ambassadors Will Receive */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    What Medivisor Health Ambassadors Will Receive
                                </h2>
                            </div>
                            <div className="space-y-8">
                                {[
                                    {
                                        title: "1. Purpose, Respect & Social Standing",
                                        items: [
                                            "Respect and recognition in your community",
                                            "Prayers and blessings from the families you help",
                                            "The honour of being known as a Medivisor Health Ambassador",
                                            "Deep satisfaction from guiding families in their hardest moments",
                                            "Official certificate of appointment and identity",
                                            "Recognition at Medivisor events and programmes"
                                        ]
                                    },
                                    {
                                        title: "2. Training, Tools & Full Backend Support",
                                        items: [
                                            "Training on proper patient guidance",
                                            "Information materials and patient education content",
                                            "Access to Medivisor's hospital and doctor network in India",
                                            "Full case-handling support from Medivisor India"
                                        ]
                                    },
                                    {
                                        title: "3. Sustainable Livelihood Support (With Dignity)",
                                        items: [
                                            "A transparent, fixed support amount per patient",
                                            "Support to run a small office",
                                            "Coverage for phone, internet, and staff costs",
                                            "Ability to work full-time serving patients"
                                        ]
                                    },
                                    {
                                        title: "4. Growth, Recognition & Belonging",
                                        items: [
                                            "Membership in a regional and international Medivisor network",
                                            "Recognition such as Outstanding Health Ambassador award",
                                            "Invitations to annual meetings and trainings",
                                            "Opportunities to grow your region and become a senior mentor"
                                        ]
                                    }
                                ].map((section, index) => (
                                    <div key={index} className="border-l-4 border-gray-300 pl-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-3">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start">
                                                    <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5">
                                                        <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                                    </div>
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-lg font-semibold text-gray-900">
                                    In One Line
                                </p>
                                <p className="mt-2 text-gray-700 text-lg">
                                    "You will earn respect, purpose, skills, and a sustainable livelihood — while helping save lives."
                                </p>
                            </div>
                        </section>

                        {/* Section 9: A Shared Mission */}
                        <section className="rounded-xl bg-white p-8 shadow-xs border border-gray-100">
                            <div className="flex items-center mb-6">
                                <div className="h-10 w-1 bg-[#E22026] rounded-full mr-4"></div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    A Shared Mission
                                </h2>
                            </div>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
                                <p>
                                    By joining this programme, you become part of a compassionate mission to reduce suffering and restore hope.
                                </p>
                                <div className="mt-6 p-6 bg-red-50 rounded-xl border border-blue-100">
                                    <p className="font-semibold text-gray-900 text-lg">
                                        Together, let us build a trusted healthcare bridge between Papua New Guinea and India.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="sticty top-20">
                        <MedivisorForm />
                    </div>
                </div>
            </div>
        </main>
    );
}