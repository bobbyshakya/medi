import Image from 'next/image';

export default function About() {
  return (
    <section className="bg-white container mx-auto py-14 md:py-10">
      <div className=" px-4 sm:px-6 lg:px-0 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Image Section */}
 <div className="flex w-full col-span-7 justify-center lg:justify-end">
          <div className="relative w-full  shadow-lg rounded-xs overflow-hidden border border-gray-200">
            <Image
              src="/about1.jpg"
              alt="Medivisor India Information"
              width={600}
              height={600}
              className="w-full h-auto border-r object-cover"
            />
          </div>
        </div>
        <div className="text-center col-span-5 lg:text-left">
          <h2 className="text-3xl md:text-4xl my-10 font-bold text-left md:mb-2 text-gray-900">
            About Us
          </h2>

          <p className="text-[#241d1f] text-lg leading-relaxed mb-4">
            <strong>Medivisor India Treatment</strong> is a trusted medical
            travel agency that assists international patients in accessing
            advanced, world-class medical care across India.
          </p>

          <p className="text-[#241d1f] text-lg leading-relaxed mb-4">
            With over 10 years of experience, we’ve supported more than
             2,000 overseas patients and maintained an impressive
             95%+ success and satisfaction rate.
          </p>

          <p className="text-[#241d1f] text-lg leading-relaxed mb-6">
            Our dedication to compassionate, professional service has been
            recognized by organizations such as the Indian Health Bureau and the
            Mitra Foundation.
          </p>

          {/* <button className="inline-flex items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 bg-[#E22026] w-auto text-white text-sm md:text-lg font-medium px-4 md:px-8 py-3 rounded-md hover:bg-[#74BF44] transition-all duration-300 transform modal-open-btn cursor-pointer hover:scale-105 mt-auto">
            Read More
          </button> */}
        </div>

       
        {/* Content Section */}

      </div>
    </section>
  );
}
