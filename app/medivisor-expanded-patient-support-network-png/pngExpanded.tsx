import PNGBanner from "@/components/PNGBanner";
import MedivisorForm from "@/components/EspeForm";

export default function Home() {
    return (
        <main className="md:min-h-screen h-full bg-gray-50">
            {/* Header */}
            <PNGBanner />

            {/* Main Content */}
            <div className="mx-auto container px-4 md:px-0" id="join-us-form">
                <div className="grid gap-6 py-8 md:py-12 lg:grid-cols-4">
                    {/* Left Column - Content Sections */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Section 1: An Invitation to Serve */}
                        <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    An Invitation to Serve
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="text-left">
                                    Over the last one year, Medivisor India Treatment has walked alongside more than a hundred families from Papua New Guinea and helped them access life-changing treatment in India. Behind every number is a human story — a mother, a father, a child — and a family that was once afraid, confused, and searching for hope.
                                </p>
                                <p className="text-left">
                                    As awareness grows, we are receiving an overwhelming number of calls and messages. This clearly shows that many more people in Papua New Guinea are suffering quietly and do not know where to turn for help.
                                </p>
                                <p className="text-left">
                                    While digital platforms have helped us reach many families, we also recognize a difficult reality: many of our countrymen are not online or are not comfortable using technology. As a result, they continue to struggle in silence — not because help does not exist, but because they cannot reach it.
                                </p>
                                <p className="text-left">
                                    To address this gap, we have launched the Medivisor Expanded Patient Support Network (PNG). This network is designed to reach villages, churches, and local communities and ensure that no one is left behind simply because they cannot connect digitally.
                                </p>
                                <p className="text-left">
                                    Since Medivisor alone cannot go deep and wide, we now invite compassionate, service-minded individuals and organizations across Papua New Guinea to join hands with us as:
                                </p>
                                <div className="mt-6 p-5 bg-[#E22026]/10 rounded-lg">
                                    <p className="text-lg font-semibold text-gray-900 text-left">
                                        Medivisor Community Health Partners
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 text-left">
                                        (Publicly recognised as Medivisor Health Ambassadors)
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Who We Are */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Who We Are
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="text-left">
                                    Medivisor India Treatment is a patient guidance and medical support organization based in New Delhi, India. For more than ten years, we have helped patients from Papua New Guinea, Fiji, Vanuatu, Solomon Islands, and other countries access safe, ethical, and affordable medical treatment in India.
                                </p>
                                <div className="md:p-5 md:rounded-lg md:border  md:border-blue-100">
                                    <p className="font-semibold text-gray-900 text-left">
                                        We do not merely coordinate treatment. We walk with patients and families like family — from their first question until their safe return home.
                                    </p>
                                </div>
                                <p className="font-semibold text-gray-900 mt-6 text-left">Our Services Include:</p>
                                <div className="space-y-3 mt-4 pl-1">
                                    {[
                                        "Hospital and doctor selection",
                                        "Treatment planning with transparent costing",
                                        "Visa, travel, and logistics support",
                                        "Accommodation and local transport in India",
                                        "On-ground patient care and coordination",
                                        "Post-treatment follow-up support"
                                    ].map((service, index) => (
                                        <div key={index} className="flex items-start -ml-2">
                                            <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 text-left flex-1">{service}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="pt-6 text-left">
                                    To date, Medivisor has assisted over 2,500 international patients and has built a strong reputation for ethics, transparency, patient safety, and compassionate care.
                                </p>
                            </div>
                        </section>

                        {/* Section 3: What Is This Programme About? */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    What Is This Network About?
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="font-normal text-gray-900 text-left">
                                    The Medivisor Expanded Patient Support Network (PNG) is a community-based support initiative created to assist patients across Papua New Guinea who struggle to access timely and appropriate medical treatment due to limited local resources or specialised expertise. Through this Network, patients are guided and supported in accessing affordable, world-class medical treatment in India.
                                </p>
                            </div>
                        </section>

                        {/* Section 4: What You Will Do */}
                        <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    What You Will Do
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="text-left">
                                    As a Medivisor Community Health Partner and Health Ambassador, you are not just performing a role — you are serving a purpose.
                                </p>
                                <p className="font-semibold text-gray-900 mt-6 text-left">You will:</p>
                                <div className="space-y-3 mt-4 pl-1">
                                    {[
                                        "Meet and listen to patients and their families in need",
                                        "Collect medical reports and share them via WhatsApp at +91 8340780250",
                                        "Receive the treatment plan and cost quotation from Medivisor and help families understand the details clearly",
                                        "Guide patients through documentation and travel processes (Medivisor will support you at every step)",
                                        "Stay connected with families throughout the treatment journey",
                                        "Act as their trusted local support and guidance point"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start -ml-2">
                                            <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 text-left flex-1">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 5: How Medivisor Supports You */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    How Medivisor Supports You
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900 text-left">Medivisor India will:</p>
                                <ul className="space-y-3 mt-4 pl-1">
                                    {[
                                        "Review and guide all medical cases",
                                        "Provide clear treatment plans and cost breakdowns for each case",
                                        "Plan and manage treatment in India",
                                        "Handle hospital coordination, stay, and local support",
                                        "Provide training, guidance, and working materials",
                                        "Stand with you in every patient case"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start -ml-2">
                                            <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-left flex-1">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 p-5 bg-red-50 rounded-lg border border-green-100">
                                    <p className="font-semibold text-gray-900 text-left">
                                        You are never alone in this journey.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 6: Sustainability */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Sustainability
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="text-left">
                                    To help Community Health Partners serve patients full-time and continue this work sustainably, Medivisor provides a simple and transparent support structure (500 PGK) per patient.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 my-5 gap-3 pl-1">
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
                                        <span className="text-gray-700 text-left">Not commission-driven</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
                                        <span className="text-gray-700 text-left">Not sales-based</span>
                                    </div>
                                </div>
                                <p className="text-left">
                                    It is a dignified and ethical system designed to keep this service alive and accessible.
                                </p>
                            </div>
                        </section>

                        {/* Section 7: Who Can Join? */}
                      <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Who Can Join?
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="font-semibold text-gray-900 text-left">
                                    We welcome individuals and organizations who:
                                </p>
                                <div className="space-y-4 mt-5 pl-1">
                                    {[
                                        "Are socially motivated and respected in their community",
                                        "Have a service-oriented mindset",
                                        "Preferably have medical or social sector exposure",
                                        "Believe in ethical, patient-first work",
                                        "Value blessings, goodwill, and long-term respect over money",
                                        "Want to build something meaningful for their community"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start -ml-2">
                                            <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                                                <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 text-left flex-1">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 8: What Health Ambassadors Will Receive */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
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
                                    <div key={index}>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-5 text-left">
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-3 pl-1">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start -ml-2">
                                                    <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                                                        <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gray-600"></div>
                                                    </div>
                                                    <span className="text-gray-700 text-left flex-1">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-lg font-semibold text-gray-900 text-left">
                                    In One Line
                                </p>
                                <p className="mt-3 text-gray-700 text-lg text-left">
                                    "You will earn respect, purpose, skills, and a sustainable livelihood — while helping save lives."
                                </p>
                            </div>
                        </section>

                        {/* Section 9: A Shared Mission */}
                       <section className="md:rounded-xl md:bg-white p-2 md:p-8 md:shadow-xs md:border md:border-gray-100">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    A Shared Mission
                                </h2>
                            </div>
                            <div className="space-y-5 text-gray-700 leading-relaxed">
                                <p className="text-left">
                                    By joining this network, you become part of a compassionate mission to reduce suffering and restore hope.
                                </p>
                                <div className="mt-8 p-3 md:p-6 bg-red-50 rounded-xl border border-blue-100">
                                    <p className="font-semibold text-gray-900 text-lg text-left">
                                        Together, let us build a trusted healthcare bridge between Papua New Guinea and India.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="sticky top-20">
                        <MedivisorForm />
                    </div>
                </div>
            </div>
        </main>
    );
}