'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ContactModal from './ContactModal'; // Assuming ContactModal is in the same directory

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ChevronsRight } from 'lucide-react';

export default function PartnerSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carouselImages = [
    {
      src: '/partner.jpg',
      alt: 'Patients receiving care 1',
    },
    {
      src: '/partner-2.jpg',
      alt: 'Medical team providing care',
    },
    {
      src: '/partner-3.jpg',
      alt: 'Healthcare professionals with patients',
    },
  ];

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <section className=" bg-gray-50 px-2 sm:px-6 py-6 md:py-10 lg:px-0">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-12 md:gap-10 items-center">
          {/* Carousel Section - Left Side */}
          <div className="order-1 md:order-2 md:mb-0 mb-8 col-span-12 md:col-span-7">
            <div className="rounded-xs shadow-xs overflow-hidden relative group">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                loop={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                navigation={{
                  nextEl: '.swiper-button-next-custom',
                  prevEl: '.swiper-button-prev-custom',
                }}
                pagination={{
                  clickable: true,
                  el: '.swiper-pagination-custom',
                }}
                className="w-full h-[250px] md:h-[500px]"
              >
                {carouselImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    <Image
                      src={image.src || '/placeholder.svg'}
                      alt={image.alt}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Custom Navigation Buttons */}
              <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:bg-white focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              {/* Custom Pagination */}
              <div className="swiper-pagination-custom absolute bottom-4 w-full flex justify-center z-10 gap-2"></div>
            </div>
          </div>

          {/* Fixed Content Section - Right Side */}
          <div className="order-2 col-span-12 md:col-span-5 md:order-1 md:text-left">
            <h2 className="heading-base mb-2">Become a Partner</h2>
            <p className="description">
              Take a closer look around, and you'll see countless patients in desperate need of the right treatment. By
              joining us, you can play a vital role in guiding them toward the care they truly deserve. Your efforts won't
              just bring deep personal satisfaction — they'll also earn the heartfelt gratitude and blessings of those
              whose lives you help transform.{" "}
              <a
                onClick={openModal}
                className="text-lg cursor-pointer inline-flex gap-x-1 items-center text-[#241d1f] hover:underline"
              >
                Know More <ChevronsRight className="w-4 h-4" />
              </a>
            </p>


          </div>
        </div>
      </section>

      {/* Contact Modal */}
      <ContactModal isOpen={isModalOpen} onClose={closeModal} />

      <style jsx global>{`
        .swiper-pagination-custom .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          display: inline-block;
          margin: 0 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid #E22026;
          opacity: 0.8;
        }
        
        .swiper-pagination-custom .swiper-pagination-bullet-active,
        .swiper-pagination-custom .swiper-pagination-bullet:hover {
          background: #E22026;
          opacity: 1;
        }
      `}</style>
    </>
  );
}