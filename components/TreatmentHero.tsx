import { Mail, Phone, MessageCircle, CheckCircle, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TreatmentCost() {


  return (

    <>
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4 mr-2" />
            Treatment Packages
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Transparent Pricing for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              World-Class Treatment
            </span>
          </h2>
          <p className="text-xl text-[#241d1f] max-w-3xl mx-auto leading-relaxed">
            Choose from our comprehensive treatment packages designed to meet your specific 
            medical needs and budget requirements.
          </p>
        </div>


        {/* Cost Information */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Understanding Treatment Costs
            </h3>
            <div className="space-y-6 text-[#241d1f] leading-relaxed">
              <p>
                Treatment costs can vary significantly based on several factors, such as the type of medical procedure required, the complexity of the condition, and the choice of healthcare facility.
              </p>
              
              <p>
                As <span className="font-semibold text-blue-700">Medivisor</span>, our expertise lies in orchestrating medical treatments in India, and we take pride in delivering detailed and personalized cost estimates. To initiate the process, we encourage you to email us your medical reports and a concise history of your health concern at{" "}
                <a 
                  href="mailto:info@medivisorhealth.com" 
                  className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2 transition-colors"
                >
                  info@medivisorhealth.com
                </a>
                . Alternatively, you can share the same information with us via Viber or WhatsApp at{" "}
                <a 
                  href="tel:+91-9643015697" 
                  className="text-blue-600 hover:text-blue-800 font-medium underline decoration-2 underline-offset-2 transition-colors"
                >
                  +91-9643015697
                </a>
                . The information will allow us to tailor a quotation to your individual needs and preferences.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email us at</p>
                  <a 
                    href="mailto:info@medivisorhealth.com"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    info@medivisorhealth.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">WhatsApp/Viber</p>
                  <a 
                    href="tel:+91-9643015697"
                    className="text-green-600 hover:text-green-800 font-medium transition-colors"
                  >
                    +91-9643015697
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800" 
              alt="Medical consultation and cost planning"
              className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent rounded-3xl"></div>
            
            {/* Floating Cost Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Get Personalized Quote</h4>
                <p className="text-[#241d1f] text-sm mb-4">Receive detailed cost estimate within 24 hours</p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-semibold">
                  Get Quote Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section></>
  );
}