import Image from 'next/image';
import { Briefcase, Users, ThumbsUp, Bell, Shield, Headphones } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      title: '10+ Years Experience',
      description: 'Over a decade of excellence in medical travel and facilitation.',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-red-50 text-red-600'
    },
    {
      title: '2,000+ Patients Helped',
      description: 'Trusted by thousands of international patients worldwide.',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: '95%+ Satisfaction',
      description: 'Consistently high treatment success and satisfaction rates.',
      icon: <ThumbsUp className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'One-Stop Services',
      description: 'Travel, treatment, and logistics—everything handled seamlessly.',
      icon: <Bell className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Safe & Transparent',
      description: 'Clear guidance with no hidden charges and complete reliability.',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-gray-50 text-[#241d1f]'
    },
    {
      title: '24/7 Support',
      description: 'Always available assistance with personalized care.',
      icon: <Headphones className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  return (
    <section className="bg-gray-50 py-16 px-6 md:px-16">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-snug">
            Why Choose Us
          </h2>
          <p className="text-[#241d1f] mt-4 max-w-2xl mx-auto md:text-lg text-base">
            We're not just another healthcare company. Here's what makes us
            stand out.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="col-span-1 grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-6 rounded-md shadow-md text-center hover:shadow-xl transition-all"
              >
                <div className="flex justify-center mb-4">
                  <div className={`w-14 h-14 rounded-full ${feature.color} flex items-center justify-center text-xl shadow-md`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {feature.title}
                </h3>
                <p className="md:text-lg text-base text-[#241d1f] mt-2">
                  {feature.description}
                </p>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-full h-[3px] bg-gradient-to-r from-[#E22026] to-[#FF6A6A] transition-all duration-300 rounded-full">
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative z-20">
            <div className="sticky top-24">
              <div className="relative">
                <Image
                  src="/hotel-hospital-transfer.jpg"
                  alt="Why Choose Us"
                  width={600}
                  height={400}
                  className="shadow-2xl rounded-md transition-transform duration-500 ease-in-out scale-105 w-full"
                />
                <div className="absolute bottom-4 left-4 bg-white px-5 py-3 rounded-md shadow-lg flex items-center space-x-4">
                  <div className="text-[#E22026] text-2xl">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Trusted By 2,000+ Clients
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}