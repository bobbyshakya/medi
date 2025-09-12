import { Metadata } from "next";
import Contact from "@/components/Contact";
import { MapPin, Phone, Mail, Clock, Globe, ArrowRight } from "lucide-react";
import Banner from "@/components/BannerService";

export const metadata: Metadata = {
  title: "Contact Medivisor India Treatment - Get Medical Tourism Support",
  description:
    "Contact Medivisor India Treatment for medical tourism assistance. Global offices in India, Mauritius, Fiji, Vanuatu, Solomon Islands, and PNG. 24/7 support available.",
  keywords:
    "contact medivisor, medical tourism contact, healthcare support India, international patient assistance",
  openGraph: {
    title: "Contact Medivisor India Treatment - Get Medical Tourism Support",
    description:
      "Reach Medivisor India for expert medical tourism assistance across multiple countries. Our global offices provide 24/7 support to international patients.",
    url: "https://medivisorindiatreatment.com/contact",
    siteName: "Medivisor India",
    type: "website",
    images: [
      {
        url: 'https://medivisorindiatreatment.com/MRX-Logo-PNG.png',
        width: 800,
        height: 250,
        alt: "Contact Medivisor India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Medivisor India Treatment",
    description:
      "Connect with Medivisor India for seamless medical tourism assistance and global support for patients.",
    site: "@MedivisorIndiatreatment",
    images: ["/Medivisor-logo.svg"],
  },
  robots: "index, follow",
  authors: [{ name: "Medivisor India" }],
  metadataBase: new URL("https://medivisorindiatreatment.com"),
};


export default function ContactPage() {
  const globalOffices = [
    {
      country: "India",
      subtitle: "Head Office",
      address:
        "Medivisor House 359, Sector 1, Vaishali, Ghaziabad, (Delhi/NCR) India",
      phone: "+91 8340 780 250",
      email: "info@medivisorhealth.com",
      hours: "24/7 Support Available",
      isHeadOffice: true,
      info: "As our head office, this location serves as the central hub for all operations. Our dedicated team here coordinates patient logistics, handles international partnerships, and provides round-the-clock support to ensure a seamless medical journey for every patient.",
    },
    {
      country: "Mauritius",
      subtitle: "Regional Office",
      address: "Port Louis, Mauritius",
      phone: "+230 5828 5542",
      email: "mauritius@medivisorhealth.com",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM",
      isHeadOffice: false,
      info: "Our Mauritius office is a key point of contact for patients in the region. We offer personalized consultations, help with visa applications, and provide pre-trip support to make your medical travel from Mauritius to India as smooth as possible.",
    },
    {
      country: "Fiji",
      subtitle: "Regional Office",
      address: "Suva, Fiji",
      phone:
        "+679 9470588 (Suva), +679 9470527 (Lautoka), +679 9789990 (Labasa)",
      email: "fiji@medivisorhealth.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM",
      isHeadOffice: false,
      info: "With multiple contact points across Fiji, we provide extensive local support for patients. Our team assists with medical consultations, helps coordinate travel arrangements, and offers on-the-ground support to ensure your medical journey is well-managed from start to finish.",
    },
    {
      country: "Vanuatu",
      subtitle: "Regional Office",
      address: "Port Vila, Vanuatu",
      phone: "+678 7627430, +678 5213197, +678 7743083",
      email: "vanuatu@medivisorhealth.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM",
      isHeadOffice: false,
      info: "The Vanuatu office provides comprehensive medical tourism services, including initial case evaluations and travel planning. Our team is committed to making the process of seeking advanced medical care abroad simple and stress-free for our clients.",
    },
    {
      country: "Solomon Islands",
      subtitle: "Regional Office",
      address: "Honiara, Solomon Islands",
      phone: "+677 7618955",
      email: "solomon@medivisorhealth.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM",
      isHeadOffice: false,
      info: "Located in Honiara, our Solomon Islands office specializes in providing medical guidance and logistical support. We help patients connect with top hospitals in India and handle all the necessary arrangements for a safe and comfortable trip.",
    },
    {
      country: "Papua New Guinea",
      subtitle: "Regional Office",
      address: "Port Moresby, PNG",
      phone: "+675 74376546",
      email: "png@medivisorhealth.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM",
      isHeadOffice: false,
      info: "Our office in Port Moresby is dedicated to serving patients from Papua New Guinea. We offer expert advice on medical treatments and facilitate all aspects of your medical journey, from arranging doctor appointments to coordinating travel and stay.",
    },
  ];

  const contactMethods = [
    {
      icon: <Phone className="w-7 h-7" />,
      title: "Call Our Medical Advisors",
      description: "For immediate assistance or to discuss a medical case, call our dedicated line. Our medical advisors are available 24/7 to provide personalized guidance on your treatment options and help with urgent inquiries. This is the fastest way to get a direct and professional consultation with our expert team.",
      action: "Call Now",
      link: "tel:+918340780250",
    },
    {
      icon: <Mail className="w-7 h-7" />,
      title: "Send Your Medical Reports",
      description: "If you have medical records or reports to share, please email us directly. This allows our clinical team to conduct a comprehensive and confidential review of your case. We will get back to you with the most suitable treatment plans, cost estimates, and a list of recommended hospitals, all tailored to your specific needs.",
      action: "Send Email",
      link: "mailto:info@medivisorhealth.com",
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: "Chat with Us on WhatsApp",
      description: "Get quick support and chat with our team on WhatsApp for any questions or help you need. This is the most convenient and instant way to communicate. Whether you have a quick query about our services or need to follow up on an existing case, our support staff is ready to assist you on the go.",
      action: "Chat Now",
      link: "https://wa.me/918340780250",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <Banner
        topSpanText="Get in Touch with Us"
        title="We're Here to Assist You Anytime"
        description="Have questions, need support, or want to learn more about our healthcare services? Reach out to Medivisor India and our team will be happy to guide you with the right information and assistance."
        buttonText="Contact Us Today"
        buttonLink="/contact"
        bannerBgImage="bg-contact.png"
        mainImageSrc="/about-main.png"
        mainImageAlt="Contact Medivisor India Support"
      />

      {/* Contact Methods */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contactMethods.map(({ icon, title, description, action, link }, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xs border border-gray-100 shadow-xs bg-white p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6 text-gray-700 transition-all duration-300">
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
                <a
                  href={link}
                  className="inline-flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-2 rounded-xs hover:bg-gray-300 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                >
                  {action}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Form */}
      <div className="bg-gray-50">
        <Contact />
      </div>

      {/* Global Offices */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            {/* <div className="inline-block px-6 py-2 bg-gray-100 rounded-full text-gray-800 font-semibold text-sm mb-4">
              Our Worldwide Presence
            </div> */}
            <h2 className="text-3xl md:text-4xl mb-3 font-bold text-gray-900 tracking-tight">
              Connect with Our Global Offices
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We have a dedicated team ready to assist you in multiple locations around the world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalOffices.map(
              ({ country, subtitle, address, phone, email, hours, isHeadOffice, info }, index) => (
                <div
                  key={index}
                  className={`group bg-gray-50 rounded-xs border border-gray-100 shadow-xs p-5  relative ${isHeadOffice ? "border-gray-100" : ""
                    }`}
                >
                  {isHeadOffice && (
                    <div className="absolute top-0 left-6 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-b-lg">
                      HEAD OFFICE
                    </div>
                  )}
                  <div className="flex flex-col mb-4 mt-6">
                    <h3 className={`text-2xl font-bold mb-1 ${isHeadOffice ? "text-gray-800" : "text-gray-900"
                      }`}>
                      {country}
                    </h3>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {subtitle}
                    </span>
                  </div>

                  {/* New Info Section */}
                  <div className="mb-6">
                    <p className="text-gray-600 leading-relaxed text-sm">{info}</p>
                  </div>

                  <div className="space-y-6">
                    {/* Address */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-4 group-hover:bg-gray-100 transition-all duration-300">
                        <MapPin className="w-5 h-5 text-gray-500" />
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium mt-1">
                        {address}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-4 group-hover:bg-gray-100 transition-all duration-300">
                        <Phone className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="space-y-1 mt-1">
                        {phone.includes(",")
                          ? phone
                            .split(",")
                            .map((p, idx) => (
                              <a
                                key={idx}
                                href={`tel:${p.trim().split(" ")[0]}`}
                                className="block text-gray-700 hover:text-gray-800 transition-colors duration-300 font-medium"
                              >
                                {p.trim()}
                              </a>
                            ))
                          : (
                            <a
                              href={`tel:${phone}`}
                              className="block text-gray-700 hover:text-gray-800 transition-colors duration-300 font-medium"
                            >
                              {phone}
                            </a>
                          )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-4 group-hover:bg-gray-100 transition-all duration-300">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <a
                        href={`mailto:${email}`}
                        className="text-gray-700 hover:text-gray-800 transition-colors duration-300 font-medium mt-1"
                      >
                        {email}
                      </a>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-4 group-hover:bg-gray-100 transition-all duration-300">
                        <Clock className="w-5 h-5 text-gray-500" />
                      </div>
                      <p className={`font-semibold mt-1 ${isHeadOffice ? "text-gray-800" : "text-gray-700"}`}>
                        {hours}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}