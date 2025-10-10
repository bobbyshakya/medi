'use client';

import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Briefcase, ExternalLink, Clock, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { useState, useEffect } from 'react';
import ContactModal from '@/components/ContactModal';
import { getBestCoverImage, getWixScaledToFillImageUrl } from '@/lib/wixMedia';

const COLLECTION_ID = 'Import1';

interface Service {
  _id?: string;
  title: string;
  description: string;
  richContent?: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  benefits: string[];
  features?: string[];
  price?: string;
  duration?: string;
  category?: string;
  tags?: string[];
  order?: number;
  isPopular?: boolean;
  ctaText?: string;
  ctaLink?: string;
  richContentNodes?: any[];
}

const ShimmerEffect = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

const LoadingSkeleton = () => (
  <section className="relative bg-white md:py-10" id="Services">
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <ShimmerEffect className="h-10 w-64" />
          <ShimmerEffect className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <ShimmerEffect className="w-10 h-10 rounded-full" />
          <ShimmerEffect className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm h-[620px]">
            <ShimmerEffect className="w-full h-44 rounded-t-xl" />
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <ShimmerEffect className="h-5 w-3/4" />
                <ShimmerEffect className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <ShimmerEffect className="h-3 w-full" />
                <ShimmerEffect className="h-3 w-5/6" />
                <ShimmerEffect className="h-3 w-4/5" />
              </div>
              <div className="flex gap-2 mt-3">
                <ShimmerEffect className="h-6 w-16 rounded-full" />
                <ShimmerEffect className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ShimmerEffect className="w-4 h-4 rounded-full" />
                    <ShimmerEffect className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
              <ShimmerEffect className="h-10 w-full rounded-xs mt-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <style jsx global>{`
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </section>
);

const ServiceCard = ({ service, onOpenModal }: { service: Service; onOpenModal: () => void }) => {
  const truncateText = (text: string, maxLength = 150) => {
    if (!text) return '';
    const plainText = text.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return text;
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalLength = lastSpace > maxLength * 0.8 ? lastSpace : maxLength;
    return plainText.substring(0, finalLength).trim() + '...';
  };

  return (
    <div className="keen-slider__slide">
      <div className="group bg-white rounded-xs overflow-hidden shadow-xs hover:shadow-xs transition-all duration-300 border border-gray-100 h-full flex flex-col relative">
        {service.isPopular && (
          <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
            Popular
          </div>
        )}
        <div className="relative h-56 overflow-hidden flex-shrink-0">
          <img
            src={service.image || '/placeholder.svg?height=200&width=400&query=medical service'}
            alt={`Image of ${service.title}`}
            className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `/placeholder.svg?height=200&width=400&query=${encodeURIComponent(service.title + ' medical service')}`;
            }}
          />
          {service.category && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {service.category}
            </div>
          )}
        </div>
        <div className="md:p-3 p-3 flex flex-col flex-grow">
          <div className="flex items-start justify-between my-3">
            <h3 className="title-text ">{service.title}</h3>
           
          </div>
          
          <div className="md:mb-4 mb-5 flex-grow h- ">
            <p className="description">
              {service.shortDescription || service.description}
            </p>
          </div>
          <div className="mb-3 ">
            <ul className="space-y-2">
              {service.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                <li key={benefitIndex} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-6 md:w-5 h-6 md:h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <Check className="md:w-3 md:h-3 w-4 h-4 text-green-600" />
                  </div>
                  <span className="description">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto pt-0 md:pt-4 text-left">
            <Button
              className="inline-flex items-center w-full justify-center whitespace-nowrap rounded-md md:text-base text-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-10 px-4 py-2 border-gray-200 text-[#241d1f] hover:bg-gray-50  left-4 right-4 mb-3"
              onClick={onOpenModal}
            >
              {service.ctaText || 'Enquire Now'}
              {/* <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /> */}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 1,
      spacing: 16,
    },
    breakpoints: {
      '(min-width: 768px)': {
        slides: { perView: 2, spacing: 20 },
      },
      '(min-width: 1024px)': {
        slides: { perView: 3, spacing: 24 },
      },
    },
  });

  const processWixImageUrl = (item: any): string => {
    const bestImage = getBestCoverImage(item);
    if (bestImage) {
      return bestImage;
    }

    const imageFields = ['image', 'photo', 'picture', 'mainImage', 'featuredImage', 'coverImage', 'thumbnail'];
    for (const field of imageFields) {
      if (item[field]) {
        let imageUrl = null;
        if (typeof item[field] === 'string' && item[field].startsWith('wix:image://')) {
          imageUrl = item[field];
        } else if (item[field]?.url && item[field].url.startsWith('wix:image://')) {
          imageUrl = item[field].url;
        } else if (item[field]?.src && item[field].src.startsWith('wix:image://')) {
          imageUrl = item[field].src;
        }
        if (imageUrl) {
          const processedUrl = getWixScaledToFillImageUrl(imageUrl, 400, 300);
          if (processedUrl) {
            return processedUrl;
          }
        }
      }
    }
    return `/placeholder.svg?height=200&width=400&query=medical service`;
  };

  const extractTextFromNodes = (nodes: any[]): string => {
    let text = '';
    for (const node of nodes) {
      if (node.type === 'TEXT' && node.textData?.text) {
        text += node.textData.text;
      } else if (node.nodes && Array.isArray(node.nodes)) {
        text += extractTextFromNodes(node.nodes);
      }
    }
    return text.trim();
  };

  const extractBenefitsFromRichContent = (richContent: any): string[] => {
    if (!richContent?.nodes) return [];
    const benefits: string[] = [];
    const findListItems = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'LIST_ITEM' && node.nodes) {
          const itemText = extractTextFromNodes(node.nodes);
          if (itemText.trim()) {
            benefits.push(itemText.trim());
          }
        } else if (node.nodes && Array.isArray(node.nodes)) {
          findListItems(node.nodes);
        }
      }
    };
    findListItems(richContent.nodes);
    return benefits;
  };

  const parseArrayField = (field: any, fallback: string[] = []): string[] => {
    if (!field) return fallback;
    if (Array.isArray(field)) {
      return field.filter(Boolean);
    }
    if (typeof field === 'string') {
      return field
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return fallback;
  };

  const parseRichContent = (content: any): { text: string; nodes?: any[] } => {
    if (!content) return { text: '' };
    if (typeof content === 'string') {
      return { text: content };
    }
    if (content.nodes && Array.isArray(content.nodes)) {
      const extractedText = extractTextFromNodes(content.nodes);
      return { text: extractedText, nodes: content.nodes };
    }
    if (content.html) {
      return { text: content.html };
    }
    return { text: '' };
  };

  const fetchServices = async () => {
    try {
      const { wixClient } = await import('@/lib/wixClient');
      const response = await wixClient.items
        .query(COLLECTION_ID)
        .skip(0)
        .limit(100)
        .descending('_createdDate')
        .find({ consistentRead: true });

      if (!response?.items?.length) {
        return [];
      }

      const servicesData: Service[] = response.items.map((item: any, originalIndex: number) => {
        const parsedRichContent = parseRichContent(item.richcontent || item.richContent);
        const parsedDescription = parseRichContent(item.description);
        const richContentBenefits = extractBenefitsFromRichContent(item.richcontent || item.richContent);
        const fallbackBenefits = parseArrayField(item.benefits, ['Professional service', 'Expert care', 'Quality assured']);

        return {
          _id: item._id || item.ID,
          title: item.title || item.name || item.serviceName || 'Service',
          description: parsedDescription.text || 'Service description',
          richContent: parsedRichContent.text,
          richContentNodes: parsedRichContent.nodes,
          shortDescription: parseRichContent(item.shortDescription || item.summary).text,
          image: processWixImageUrl(item),
          images: item.images ? parseArrayField(item.images).map((img: any) => processWixImageUrl({ image: img })) : undefined,
          benefits: richContentBenefits.length > 0 ? richContentBenefits : fallbackBenefits,
          features: parseArrayField(item.features),
          price: item.price || item.cost || item.pricing,
          duration: item.duration || item.timeRequired || item.estimatedTime,
          category: item.category || item.serviceCategory || item.type,
          tags: parseArrayField(item.tags),
          order: Number.parseInt(item.order) || Number.parseInt(item.Order) || originalIndex,
          isPopular: item.isPopular || item.featured || item.popular || false,
          ctaText: item.ctaText || item.buttonText || 'Enquire Now',
          ctaLink: item.ctaLink || item.bookingLink || item.contactLink,
        };
      });
      return servicesData.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error: any) {
      console.error('[v0] Wix API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchServices();
        setServices(result);
      } catch (err: any) {
        setError('Unable to load services data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (services.length === 0) {
    return (
      <section className="relative bg-white md:py-10" id="Services">
        <div className="container md:px-0 px-4 mx-auto">
          <div className="text-center max-w-2xl mx-auto py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
              <Briefcase className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="heading-lg">
              Our Services
            </h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative bg-white py-10 px-2 md:px-0 md:py-10" id="Services">
        <div className="container  mx-auto">
          <div className="flex justify-between items-center mb-3 md:mb-3">
            <div>
              <h2 className="text-3xl  md:text-4xl font-bold text-left text-gray-900">Our Services</h2>
              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => instanceRef.current?.prev()}
                className="bg-white text-[#241d1f] p-2 rounded-full  cursor-pointer transition-colors shadow-lg hover:shadow-xl"
                aria-label="Previous service"
              >
                <ChevronLeft className="w-4 md:h-5 md:w-5 h-4" />
              </button>
              <button
                onClick={() => instanceRef.current?.next()}
                className="bg-white text-[#241d1f] p-2 rounded-full  cursor-pointer transition-colors shadow-lg hover:shadow-xl"
                aria-label="Next service"
              >
                <ChevronRight className="w-4 md:h-5 md:w-5 h-4" />
              </button>
            </div>
          </div>
          <div ref={sliderRef} className="keen-slider">
            {services.map((service, index) => (
              <ServiceCard key={service._id || index} service={service} onOpenModal={openModal} />
            ))}
          </div>
        </div>
      </section>
      <ContactModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}