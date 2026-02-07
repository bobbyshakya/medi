import PNGBanner from "@/components/PNGBanner";
import MedivisorForm from "@/components/EspeForm";

export default function Home() {
    return (
        <main className="md:min-h-screen h-full bg-white md:bg-gray-50">
            {/* Header */}
            <PNGBanner />

            {/* Main Content */}
            <div className="mx-auto text-lg container px-4 md:px-6" id="join-us-form">
                <div className="grid gap-8 py-8 md:py-12 lg:grid-cols-4">
                    {/* Left Column - Content Sections */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Section 1: An Invitation to Serve */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    An Invitation to Serve
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    Over the last one year, Medivisor India Treatment has walked alongside more than a hundred families from Papua New Guinea and helped them access life-changing treatment in India. Behind every number is a human story — a mother, a father, a child — and a family that was once afraid, confused, and searching for hope.
                                </p>
                                <p>
                                    As awareness grows, we are receiving an overwhelming number of calls and messages. This clearly shows that many more people in Papua New Guinea are suffering quietly and do not know where to turn for help.
                                </p>
                                <p>
                                    While digital platforms have helped us reach many families, we also recognize a difficult reality: many of the countrymen are not online or are not comfortable using technology. As a result, they continue to struggle in silence — not because the treatment doesn't exist anywhere in the world, but because they cannot reach it.
                                </p>
                                <p>
                                    To address this gap, we have launched the Medivisor Expanded Patient Support Network (PNG). This network is designed to reach villages, churches, and local communities and ensure that no one is left behind simply because they cannot connect digitally.
                                </p>
                                <p>
                                    Since Medivisor alone cannot go deep and wide, we now invite compassionate, service-minded individuals and organizations across Papua New Guinea to join hands with us as:
                                </p>
                                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                                    <p className="text-lg md:text-xl font-semibold text-gray-900">
                                        Medivisor Community Health Partners
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        (Publicly recognised as Medivisor Health Ambassadors)
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Who We Are */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Who We Are
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    Medivisor India Treatment is a patient guidance and medical support organization based in New Delhi, India. For more than ten years, we have helped over 2500 patients from Papua New Guinea, Fiji, Vanuatu, Solomon Islands, and other countries access safe, ethical, and affordable medical treatment in India.
                                </p>
                                <div className="p-6 rounded-lg border bg-gray-50 border-gray-200">
                                    <p className="font-medium text-gray-900">
                                        We do not merely coordinate treatment. We walk with patients and families like family — from their first question until their safe return home.
                                    </p>
                                </div>
                                <p className="font-semibold text-gray-900 mt-8">Our Services Include:</p>
                                <div className="space-y-4 text-lg mt-4">
                                    {[
                                        "Hospital and doctor selection",
                                        "Treatment planning with transparent costing",
                                        "Visa, travel, and logistics support",
                                        "Accommodation and local transport in India",
                                        "On-ground patient care and coordination",
                                        "Post-treatment follow-up support"
                                    ].map((service, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 flex-1 text-lg">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: What Is This Programme About? */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    What Is This Network About?
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p className="font-medium text-gray-900">
                                    The Medivisor Expanded Patient Support Network (PNG) is a community-based support initiative created to assist patients across Papua New Guinea who struggle to access timely and appropriate medical treatment due to limited local resources or specialised expertise. Through this Network, patients are guided and supported in accessing affordable, world-class medical treatment in India.
                                </p>
                            </div>
                        </section>

                        {/* Section 4: What You Will Do */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    What You Will Do
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    As a Medivisor Community Health Partner and Health Ambassador, you will be not just performing a role — you will be serving a purpose.
                                </p>
                                <p className="font-semibold text-gray-900 mt-8">You will:</p>
                                <div className="space-y-4 text-lg mt-4">
                                    {[
                                        "Meet and listen to patients and their families living in your community",
                                        "Collect medical reports and share them with us via WhatsApp at +91 8340780250",
                                        "Receive the treatment plan and cost quotation from us and help families understand the details clearly",
                                        "Guide patients through documentation and travel processes (Medivisor will support you at every step)",
                                        "Stay connected with families throughout the treatment journey",
                                        "Act as their trusted local support and guidance point"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 flex-1 text-lg">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 5: How Medivisor Supports You */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    How Medivisor Supports You
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p className="font-semibold text-gray-900">Medivisor India will:</p>
                                <ul className="space-y-4 text-lg mt-4">
                                    {[
                                        "Review and guide all medical cases",
                                        "Provide clear treatment plans and cost breakdowns for each case",
                                        "Plan and manage treatment in India",
                                        "Handle hospital coordination, stay, and local support",
                                        "Provide training, guidance, and working materials",
                                        "Stand with you in every patient case"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="flex-1">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="font-medium text-gray-900">
                                        You are never alone in this journey.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 6: Sustainability */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Sustainability
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    To help Community Health Partners serve patients full-time and continue this work sustainably, Medivisor provides a simple and transparent support structure (500 PGK) per patient.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 my-6 gap-4">
                                    <div className="flex items-center">
                                        <div className="h-3 w-3 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                                        <span className="text-gray-700">Not commission-driven</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-3 w-3 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                                        <span className="text-gray-700">Not sales-based</span>
                                    </div>
                                </div>
                                <p>
                                    It is a dignified and ethical system designed to keep this service alive and accessible.
                                </p>
                            </div>
                        </section>

                        {/* Section 7: Who Can Join? */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Who Can Join?
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p className="font-semibold text-gray-900">
                                    We welcome individuals and organizations who:
                                </p>
                                <div className="space-y-4 text-lg mt-4">
                                    {[
                                        "Are socially motivated and respected in their community",
                                        "Have a service-oriented mindset",
                                        "Preferably have medical or social sector exposure",
                                        "Believe in ethical, patient-first work",
                                        "Value blessings, goodwill, and long-term respect over money",
                                        "Want to build something meaningful for their community"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 flex-1 text-lg">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 8: What Health Ambassadors Will Receive */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    What Medivisor Health Ambassadors Will Receive
                                </h2>
                            </div>
                            <div className="space-y-8">
                                <ul className="space-y-4 text-lg ">
                                    {[
                                        "Respect and recognition in your community",
                                        "Prayers and blessings from the families you help",
                                        "Deep satisfaction from guiding families in their hardest moments",
                                        "A transparent, fixed support amount (500 PGK) per patient",
                                        "The honour of being known as a Medivisor Health Ambassador",
                                        "Membership in a regional and international Medivisor network",
                                        "Recognition at Medivisor annual events and programmes"
                                    ].map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex items-start">
                                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                            </div>
                                            <span className="text-gray-700 flex-1 text-lg">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-700 text-lg font-medium">
                                    You will earn respect, purpose, skills, and a sustainable livelihood — while helping save lives.
                                </p>
                            </div>
                        </section>

                        {/* Section 9: A Shared Mission */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    A Shared Mission
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    By joining this network, you will become part of a compassionate mission to reduce suffering and restore hope.
                                </p>
                                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="font-medium text-gray-900 text-lg">
                                        Together, let us build a trusted healthcare bridge between Papua New Guinea and India.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Form */}
                    <div className="sticky top-24 h-fit">
                        <MedivisorForm />
                    </div>
                </div>
            </div>
        </main>
    );
}