import Image from "next/image"

export default function AboutUsSection() {
  return (
    <section className="py-16 md:py-24 bg-white" id="about-us">
      <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="lg:order-2">
          <Image
            src="/placeholder.svg?height=500&width=700"
            alt="About Us"
            width={700}
            height={500}
            className="rounded-lg shadow-xl w-full h-auto object-cover"
          />
        </div>
        <div className="lg:order-1">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Committed to Your Health and Well-being</h2>
          <p className="text-[#241d1f] text-lg leading-relaxed mb-6">
            At our clinic, we are dedicated to providing the highest standard of medical care. With a team of
            experienced specialists and state-of-the-art facilities, we offer a comprehensive range of treatments
            designed to meet your unique health needs.
          </p>
          <p className="text-[#241d1f] text-lg leading-relaxed">
            Our patient-centric approach ensures that you receive personalized attention and compassionate support
            throughout your healthcare journey. We believe in empowering our patients with knowledge and fostering a
            partnership for better health outcomes.
          </p>
        </div>
      </div>
    </section>
  )
}
