import Image from 'next/image';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Heart, Brain, Eye, Baby, Weight, Stethoscope, Activity, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Medical Treatments in India - World-Class Healthcare for International Patients',
  description: 'Comprehensive medical treatments in India including heart surgery, cancer treatment, organ transplants, orthopedics, and more. Advanced healthcare at affordable costs.',
  keywords: 'medical treatments India, heart surgery, cancer treatment, organ transplant, orthopedics, neurosurgery, medical tourism',
};

export default function TreatmentsPage() {
  const treatmentCategories = [
    {
      title: 'Cardiac Care',
      description: 'Advanced heart treatments and surgeries',
      icon: <Heart className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/3985170/pexels-photo-3985170.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Heart Bypass Surgery',
        'Valve Replacement',
        'Angioplasty & Stenting',
        'ASD/VSD Closure',
        'Heart Transplant'
      ]
    },
    {
      title: 'Oncology',
      description: 'Comprehensive cancer treatment and care',
      icon: <Activity className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/3952048/pexels-photo-3952048.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Chemotherapy',
        'Radiation Therapy',
        'Surgical Oncology',
        'Bone Marrow Transplant',
        'Immunotherapy'
      ]
    },
    {
      title: 'Neurosurgery',
      description: 'Brain and spine surgical procedures',
      icon: <Brain className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Brain Tumor Surgery',
        'Spine Surgery',
        'Epilepsy Surgery',
        'Deep Brain Stimulation',
        'Aneurysm Treatment'
      ]
    },
    {
      title: 'Orthopedics',
      description: 'Joint replacement and bone treatments',
      icon: <Zap className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Knee Replacement',
        'Hip Replacement',
        'Shoulder Surgery',
        'Spine Surgery',
        'Sports Medicine'
      ]
    },
    {
      title: 'Organ Transplant',
      description: 'Life-saving organ transplantation',
      icon: <Stethoscope className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/305568/pexels-photo-305568.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Kidney Transplant',
        'Liver Transplant',
        'Heart Transplant',
        'Lung Transplant',
        'Pancreas Transplant'
      ]
    },
    {
      title: 'Fertility & IVF',
      description: 'Advanced reproductive treatments',
      icon: <Baby className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'IVF Treatment',
        'ICSI',
        'Egg Donation',
        'Surrogacy',
        'Fertility Preservation'
      ]
    },
    {
      title: 'Ophthalmology',
      description: 'Comprehensive eye care and surgery',
      icon: <Eye className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/139398/thermometer-headache-pain-pills-139398.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Cataract Surgery',
        'LASIK Surgery',
        'Retinal Surgery',
        'Glaucoma Treatment',
        'Corneal Transplant'
      ]
    },
    {
      title: 'Bariatric Surgery',
      description: 'Weight loss surgical procedures',
      icon: <Weight className="w-8 h-8" />,
      image: 'https://images.pexels.com/photos/3985170/pexels-photo-3985170.jpeg?auto=compress&cs=tinysrgb&w=600',
      treatments: [
        'Gastric Bypass',
        'Sleeve Gastrectomy',
        'Gastric Band',
        'Duodenal Switch',
        'Revision Surgery'
      ]
    }
  ];

  const features = [
    {
      title: 'World-Class Hospitals',
      description: 'JCI, NABH, and AACI accredited facilities',
      icon: '🏥'
    },
    {
      title: 'Expert Surgeons',
      description: 'Internationally trained specialists',
      icon: '👨‍⚕️'
    },
    {
      title: 'Advanced Technology',
      description: 'Latest medical equipment and techniques',
      icon: '🔬'
    },
    {
      title: 'Cost Effective',
      description: 'Up to 70% savings compared to Western countries',
      icon: '💰'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#E22026] to-[#74BF44] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              World-Class Medical Treatments in India
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Advanced healthcare solutions at affordable costs
            </p>
            <Button className="bg-white text-[#E22026] hover:bg-gray-100 text-lg px-8 py-3">
              Explore Treatments
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#241d1f] text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Treatment Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#241d1f] mb-4">
              Our Treatment Specialties
            </h2>
            <p className="text-xl text-[#241d1f] max-w-3xl mx-auto">
              Comprehensive medical care across all major specialties
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {treatmentCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="mb-2">
                        {category.icon}
                      </div>
                      <h3 className="text-xl font-bold">{category.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#241d1f] mb-4">
                    {category.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {category.treatments.map((treatment, treatmentIndex) => (
                      <li key={treatmentIndex} className="text-sm text-[#241d1f] flex items-center">
                        <div className="w-2 h-2 bg-[#E22026] rounded-full mr-3"></div>
                        {treatment}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-[#E22026] hover:bg-[#74BF44] transition-colors">
                    Learn More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why India Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose India for Medical Treatment?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-[#E22026] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Cost Advantage
                    </h3>
                    <p className="text-[#241d1f]">
                      Save up to 70% on medical costs compared to Western countries without compromising on quality.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-[#E22026] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      World-Class Infrastructure
                    </h3>
                    <p className="text-[#241d1f]">
                      State-of-the-art hospitals with international accreditations and latest medical technology.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-[#E22026] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Expert Medical Professionals
                    </h3>
                    <p className="text-[#241d1f]">
                      Highly qualified doctors and surgeons with international training and experience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-[#E22026] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-1">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Waiting Time
                    </h3>
                    <p className="text-[#241d1f]">
                      Immediate access to treatments without long waiting periods common in other countries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Medical treatment in India"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#E22026] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Get Your Personalized Treatment Plan
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Share your medical reports and get detailed treatment options from top hospitals in India
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-[#E22026] hover:bg-gray-100 text-lg px-8 py-3">
              Get Free Consultation
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#E22026] text-lg px-8 py-3">
              Download Brochure
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}