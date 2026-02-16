import PNGBanner from "@/components/extend-banner";
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
                                    About the Network
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    The Medivisor Expanded Patient Support Network (MEPSN) is a growing community-based support network with over 200 Community Health Partners and Health Ambassadors, working together across the Pacific, Africa, CIS, and other regions to assist patients who struggle to access timely and appropriate medical treatment due to limited local resources or specialised expertise.
                                    Through this Network, patients and families are guided with compassion and care, and supported in accessing affordable, world-class medical treatment in India.
                                </p>
                            </div>
                        </section>

                        {/* Section 3: What Is This Programme About? */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    The Need for the Network
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p className="font-medium text-gray-900">
                                    Across different parts of the world, thousands of patients suffer in silence — not because treatment does not exist, and not always because they cannot afford it — but because they do not know where to go, whom to trust, or how to connect overseas for proper treatment.</p>
                                <p className="font-medium text-gray-900">
                                    Many families lack guidance, reliable contacts, or the confidence to navigate international healthcare systems. They often have no one to explain the process, review their reports, or help them make informed decisions.</p>
                                <p className="font-medium text-gray-900">
                                    The Medivisor Expanded Patient Support Network acts as guiding and helping hands for such families. The Network works actively in villages, churches, religious institutions, and local communities — ensuring that no patient is left behind simply because they lack information, access, contacts, or digital skills.
                                </p>
                            </div>
                        </section>

                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    An Invitation to Join  </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>
                                    As the Network continues to grow, we welcome compassionate, service-minded individuals and organizations who wish to be part of this mission — helping families find clarity, support, and a path toward healing.
                                </p>
                                <p>
                                    Together, we can continue building a trusted bridge between communities and world-class medical care.
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
                                <p className="font-medium text-gray-900 mt-8">You will:</p>
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
                                    How Medivisor India Supports You
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p className="font-medium text-gray-900">Medivisor India will:</p>
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
                                    To help Community Health Partners serve patients full-time and continue this work sustainably, Medivisor provides a simple and transparent support structure (100 USD) per patient.
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 my-6 gap-4">
                                    <div className="flex items-center">
                                        <div className="h-3 w-3 rounded-full bg-gray-400 mr-3 flex-shrink-0"></div>
                                        <span className="text-gray-700">Not commission-driven</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="h-3 w-3 rounded-full bg-gray-400 mr-3 flex-shrink-0"></div>
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
                                <p className="font-medium text-gray-900">
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
                                        "A transparent, fixed support amount (100 USD) per patient",
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

                        {/* Section 9: Together, We Are the Bridge */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                   Together, We Are the Bridge
                                </h2>
                            </div>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg md:text-lg">
                                <p>  Every patient deserves a chance to heal. Every family deserves guidance and hope. Through the Medivisor Expanded Patient Support Network, we come together as one compassionate community — reaching into villages, churches, and neighbourhoods to ensure that no one suffers in silence. We are more than a network. We are hands that help, hearts that care.</p>
                                <p>     If you feel called to serve, to guide families, and to be a source of hope in your community, we invite you to walk this journey with us. Join the Medivisor Expanded Patient Support Network today as:</p>
                                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                                    <p className="text-lg md:text-xl font-semibold text-gray-900">
                                        Medivisor Community Health Partners
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        (Publicly recognised as Medivisor Health Ambassadors)
                                    </p>
                                </div>
                                <p>     Because no patient should ever be left behind.</p>
                            </div>
                        </section>

                        {/* UPDATED Section 10: MHA Testimonials - Using exact content */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Medivisor Health Ambassador Testimonials
                                </h2>
                                <p className="text-gray-600 mt-2 text-lg">Hear from our amazing Health Ambassadors making a difference</p>
                                <div className="w-20 h-1 bg-gray-300 mt-4"></div>
                            </div>
                            
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* MHA Testimonial 1 (Community Focus) */}
                                <div className="relative p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
                                    <div className="absolute -top-2 -left-2 text-5xl hover:text-xl text-gray-200 group-hover:text-[#75c044] transition-colors">"</div>
                                    <div className="relative">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4 italic">
                                            "Before joining Medivisor, many patients in my area didn't know where to go for serious treatment. Today, I feel proud that I can guide families with confidence. Medivisor supports us at every step, and seeing patients return home healthier gives me deep satisfaction."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-gray-900 font-semibold text-sm">— Medivisor Health Ambassador</p>
                                        </div>
                                    </div>
                                </div>

                                {/* MHA Testimonial 2 (Faith / Service Tone) */}
                                <div className="relative p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
                                    <div className="absolute -top-2 -left-2 text-5xl hover:text-xl text-gray-200 group-hover:text-[#75c044] transition-colors">"</div>
                                    <div className="relative">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4 italic">
                                            "This is not just work — it is service. Families come scared and confused, and we help them find hope. Medivisor truly lives by its promise: Hands That Help. Hearts That Care."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-gray-900 font-semibold text-sm">— Medivisor Health Ambassador</p>
                                        </div>
                                    </div>
                                </div>

                                {/* MHA Testimonial 3 (Impact-Oriented) */}
                                <div className="relative p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
                                    <div className="absolute -top-2 -left-2 text-5xl hover:text-xl text-gray-200 group-hover:text-[#75c044] transition-colors">"</div>
                                    <div className="relative">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4 italic">
                                            "Being part of the Medivisor Expanded Patient Support Network has changed how my community looks at healthcare. People trust us because we guide them honestly. I feel blessed to be part of something that saves lives."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-gray-900 font-semibold text-sm">— Medivisor Health Ambassador</p>
                                        </div>
                                    </div>
                                </div>

                                {/* MHA Testimonial 4 (Practical + Emotional) */}
                                <div className="relative p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
                                    <div className="absolute -top-2 -left-2 text-5xl hover:text-xl text-gray-200 group-hover:text-[#75c044] transition-colors">"</div>
                                    <div className="relative">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4 italic">
                                            "Medivisor makes everything simple — from reports to treatment planning. I am never alone in any case. But the biggest reward is when families thank you after successful treatment. That feeling cannot be explained."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-gray-900 font-semibold text-sm">— Medivisor Health Ambassador</p>
                                        </div>
                                    </div>
                                </div>

                                {/* MHA Testimonial 5 (Family Impact) */}
                                <div className="relative p-6 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-300 group md:col-span-2">
                                    <div className="absolute -top-2 -left-2 text-5xl hover:text-xl text-gray-200 group-hover:text-[#75c044] transition-colors">"</div>
                                    <div className="relative max-w-3xl mx-auto">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4 italic text-center">
                                            "When families come to me, they are often worried and unsure. With Medivisor's support, I can guide them with clarity and confidence. Seeing children smile again and parents feel relieved reminds me why this work matters. I am grateful to be a Medivisor Health Ambassador."
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                                            <p className="text-gray-900 font-semibold text-sm">— Medivisor Health Ambassador</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* UPDATED Section 11: Patient Testimonials - Using exact content */}
                        <section className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                            <div className="mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    Patient Testimonials
                                </h2>
                                <p className="text-gray-600 mt-2 text-xl">Stories of hope and healing from families we served</p>
                                <div className="w-20 h-1 bg-gray-300 mt-4"></div>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Patient Testimonial 1 – Family Relief */}
                                <div className="relative p-6 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                                                P
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                                                "We were confused and scared because no one could guide us properly. Medivisor helped us understand everything — from reports to treatment in India. Today my husband is recovering well. We will always be thankful."
                                            </p>
                                            <div className="flex items-center gap-3 text-base">
                                                <span className="font-medium text-gray-900">— Patient Family, PNG</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Testimonial 2 – Trust & Guidance */}
                                <div className="relative p-6 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                                                P
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                                                "Before Medivisor, we went to many places without answers. Through their Health Ambassador, we finally found the right doctors. They treated us like family. God bless the whole team."
                                            </p>
                                            <div className="flex items-center gap-3 text-base">
                                                <span className="font-medium text-gray-900">— Patient Family</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Testimonial 3 – Child's Treatment */}
                                <div className="relative p-6 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                                                P
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                                                "My child needed urgent treatment and we had no idea where to go. Medivisor guided us step by step. From hospital selection to stay in India, everything was handled with care. Today my child is smiling again."
                                            </p>
                                            <div className="flex items-center gap-3 text-base">
                                                <span className="font-medium text-gray-900">— Patient Family</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Testimonial 4 – Simple & Emotional */}
                                <div className="relative p-6 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                                                P
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                                                "Medivisor gave us hope when we had none. They explained everything clearly and supported us throughout the journey. We are grateful beyond words."
                                            </p>
                                            <div className="flex items-center gap-3 text-base">
                                                <span className="font-medium text-gray-900">— Patient Family</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Testimonial 5 – Community Impact */}
                                <div className="relative p-6 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-200">
                                    <div className="flex gap-4">
                                        <div className="hidden sm:block">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                                                P
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-700 leading-relaxed text-lg mb-3">
                                                "Because of Medivisor and our local Health Ambassador, many families in our area now know where to seek proper treatment. They truly live by their promise — Hands That Help. Hearts That Care."
                                            </p>
                                            <div className="flex items-center gap-3 text-base">
                                                <span className="font-medium text-gray-900">— Patient Family</span>
                                            </div>
                                        </div>
                                    </div>
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