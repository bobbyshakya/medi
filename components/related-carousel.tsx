// components/related-carousel.tsx
'use client'

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';
import { ChevronLeft, ChevronRight, HeartPulse, Stethoscope, BriefcaseMedical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

// Helper function from your page.tsx
// Assuming this is correctly imported from your project structure
import { getWixScaledToFillImageUrl } from '@/lib/wixMedia';

// ============ Type Definitions from page.tsx ============
interface Hospital {
  _id: string
  Title: string // <-- Used for the main display title
  name: string // <-- Another field for the name
  slug: string
  type: string
  yearEstablished: string
  city: string
  state: string
  description: string
  rating: number
  totalBeds: string
  image: string
}

interface Doctor {
  _id: string;
  slug: string;
  name: string;
  specializations: string[];
  profilePicture: string;
  rating: number;
}

interface Treatment {
  _id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  successRate: number;
}

interface RelatedData {
  hospitals: Hospital[];
  doctors: Doctor[];
  treatments: Treatment[];
}

interface RelatedItemsCarouselProps {
  relatedData: RelatedData;
}

// ============ Individual Item Components ============

// Helper for the navigation buttons
const NavButton = ({ direction, className }: { direction: 'prev' | 'next', className: string }) => (
  <div
    className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/70 shadow-md border border-gray-200 transition-all duration-300 hover:bg-gray-100 cursor-pointer ${className}`}
    aria-label={`${direction} slide`}
  >
    {direction === 'prev' ? <ChevronLeft size={20} className="text-[#241d1f]" /> : <ChevronRight size={20} className="text-[#241d1f]" />}
  </div>
);

// --- Hospital Card ---
const HospitalCard: React.FC<{ item: Hospital }> = ({ item }) => (
  <Link
    href={`/hospitals/${item.slug}`}
    // Styling: minimal shadow ('shadow-sm') and rounded-xs
    className="block bg-white rounded-xs shadow-sm border border-gray-200 p-6 h-full transition-all duration-200 hover:shadow-md hover:border-gray-300"
  >
    <div className="flex items-center mb-4">
      {item.image ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={getWixScaledToFillImageUrl(item.image, 64, 64)}
            alt={item.Title || item.name}
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <HeartPulse size={24} className="text-gray-400" />
        </div>
      )}
      <div className="ml-4 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.Title || item.name || 'Hospital Name N/A'}</h3>
        <p className="text-sm text-[#241d1f] truncate">
          {(item.city && item.state) ? `${item.city}, ${item.state}` : 'Location N/A'}
        </p>
      </div>
    </div>
    {/* FIX: Added robust description display with fallback */}
    <p className="text-[#241d1f] text-sm line-clamp-2 mb-4">
      {item.description 
        ? `${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}` 
        : 'No description provided.'}
    </p>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center">
   
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {item.yearEstablished} year Established
        </span>
      </div>
      {/* FIX: Ensure totalBeds displays only if present */}
      {(item.totalBeds && item.totalBeds !== '—') && (
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {item.totalBeds} beds
        </span>
      )}
    </div>
  </Link>
);

// --- Doctor Card ---
const DoctorCard: React.FC<{ item: Doctor }> = ({ item }) => (
  <Link
    key={item._id}
    href={`/doctors/${item.slug}`}
    // Styling: minimal shadow ('shadow-sm') and rounded-xs
    className="block bg-white rounded-xs shadow-sm border border-gray-200 p-6 h-full transition-all duration-200 hover:shadow-md hover:border-gray-300"
  >
    <div className="flex items-center mb-4">
      {item.profilePicture ? (
        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={getWixScaledToFillImageUrl(item.profilePicture, 64, 64)}
            alt={item.name}
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Stethoscope size={24} className="text-gray-400" />
        </div>
      )}
      <div className="ml-4 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name || 'Doctor Name N/A'}</h3>
        {/* FIX: Added robust specialization display with fallback */}
        <p className="text-sm text-[#241d1f] truncate">
          {item.specializations?.length > 0 ? item.specializations.slice(0, 2).join(', ') : 'Specialist / N/A'}
        </p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center">
        <span className="text-yellow-500 text-sm">★</span>
        <span className="ml-1 text-[#241d1f] text-sm font-medium">
          {item.rating && item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
        </span>
      </div>
      <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
        View Profile
      </span>
    </div>
  </Link>
);

// --- Treatment Card ---
const TreatmentCard: React.FC<{ item: Treatment }> = ({ item }) => (
  <Link
    key={item._id}
    href={`/treatments/${item.slug}`}
    // Styling: minimal shadow ('shadow-sm') and rounded-xs
    className="block bg-white rounded-xs shadow-sm border border-gray-200 p-6 h-full transition-all duration-200 hover:shadow-md hover:border-gray-300"
  >
    <div className="flex items-center mb-4">
      {item.image ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={getWixScaledToFillImageUrl(item.image, 64, 64)}
            alt={item.name}
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <BriefcaseMedical size={24} className="text-gray-400" />
        </div>
      )}
      <div className="ml-4 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name || 'Treatment Name N/A'}</h3>
        <p className="text-sm text-[#241d1f] truncate">{item.category || 'Medical Treatment'}</p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-auto">
      <span className="text-[#241d1f] text-sm">Success Rate:</span>
      <span className="text-green-600 text-sm font-semibold">
        {item.successRate && item.successRate > 0 ? `${item.successRate}%` : 'N/A'}
      </span>
    </div>
  </Link>
);

// ============ Main Carousel Component ============
// ... (The rest of the component remains the same as its logic is correct)
const RelatedItemsCarousel: React.FC<RelatedItemsCarouselProps> = ({ relatedData }) => {
  // Determine if any related data exists to render the whole section
  const hasRelatedData =
    relatedData.hospitals.length > 0 ||
    relatedData.doctors.length > 0 ||
    relatedData.treatments.length > 0;

  if (!hasRelatedData) {
    return null; // Don't render anything if there's no related data
  }

  // Carousel configuration for a responsive layout
  const swiperParams = {
    modules: [Navigation, A11y],
    spaceBetween: 24, // Gap between slides
    slidesPerView: 1,
    navigation: {
      prevEl: '.swiper-button-prev-custom',
      nextEl: '.swiper-button-next-custom',
    },
    breakpoints: {
      // when window width is >= 640px
      640: {
        slidesPerView: 2,
        spaceBetween: 24,
      },
      // when window width is >= 1024px
      1024: {
        slidesPerView: 3,
        spaceBetween: 24,
      },
    },
  };

  const renderCarouselSection = (
    title: string,
    items: (Hospital | Doctor | Treatment)[],
    CardComponent: React.FC<any>,
    emptyMessage: string
  ) => {
    if (items.length === 0) {
      // Styling: minimal shadow ('shadow-sm') and rounded-xs
      return (
        <div className="bg-white rounded-xs shadow-sm border border-gray-200 p-8 text-center mt-6">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    const prevId = `prev-${title.replace(/\s/g, '-')}`;
    const nextId = `next-${title.replace(/\s/g, '-')}`;

    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="relative">
          <Swiper
            {...swiperParams}
            navigation={{
              prevEl: `.${prevId}`,
              nextEl: `.${nextId}`,
            }}
            className="pb-2" // Add some padding for shadow/navigation visibility
          >
            {items.map((item: any) => (
              <SwiperSlide key={item._id}>
                <CardComponent item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Custom Navigation Arrows */}
          <NavButton direction="prev" className={`${prevId} hidden sm:flex left-0 -ml-14 xl:-ml-20`} />
          <NavButton direction="next" className={`${nextId} hidden sm:flex right-0 -mr-14 xl:-mr-20`} />
        </div>
      </section>
    );
  };

  return (
    <div className="mt-16 space-y-12">
      {renderCarouselSection(
        'Related Hospitals',
        relatedData.hospitals,
        HospitalCard,
        'No related hospitals found'
      )}

      {renderCarouselSection(
        'Related Doctors',
        relatedData.doctors,
        DoctorCard,
        'No related doctors found'
      )}

      {renderCarouselSection(
        'Related Treatments',
        relatedData.treatments,
        TreatmentCard,
        'No related treatments found'
      )}
    </div>
  );
};

export default RelatedItemsCarousel;