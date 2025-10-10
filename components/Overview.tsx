import {CheckCircle} from "lucide-react"
export default function Overview() {
  return (
    <section className="bg-gray-50 py-10 lg:py-10">
      <div className="container mx-auto  grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="w-full overflow-hidden rounded-md shadow-sm border border-gray-200">
          <div className="relative aspect-w-16 aspect-h-9">
            <iframe
              className="w-full h-full min-h-[200px] md:min-h-[400px]"
              src="https://www.youtube.com/embed/92hFjvm8uuU?si=MujPXbQSij-wMi0k?autoplay=1&rel=0&modestbranding=1&showinfo=0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl sm:text-4xl font-semibold text-gray-900 mb-6 leading-snug">
            A Message to
            <strong> International Patients </strong> from Our
            Medical Director
          </h2>
          
          <p className="text-base md:text-lg text-[#241d1f] leading-relaxed mb-5">
            We understand that traveling for medical care is a life-changing
            decision. Our Medical Director is committed
            to providing compassionate guidance and premium medical
            solutions for patients worldwide, including those
            from Mauritius.
          </p>
          
          <ul className="space-y-3 text-base md:text-lg text-[#241d1f]">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500  flex-shrink-0" />
              Dedicated medical concierge from arrival to departure
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500  flex-shrink-0" />
              Access to accredited hospitals and renowned specialists
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500  flex-shrink-0" />
              Personalized treatment plans with full transparency
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}