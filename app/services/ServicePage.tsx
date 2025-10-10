"use client"
import { Button } from "@/components/ui/button"
import { Check, Briefcase, ExternalLink, Clock, DollarSign, Tag } from "lucide-react"
import "keen-slider/keen-slider.min.css"
import Banner from "@/components/BannerService"
import ContactModal from '@/components/ContactModal';
import { useState, useEffect } from "react"
import CtaSection from "@/components/CtaSection"
import { getBestCoverImage, getWixScaledToFillImageUrl } from "@/lib/wixMedia"

const COLLECTION_ID = "Import1"

interface Service {
    _id?: string
    title: string
    description: string
    richContent?: string
    shortDescription?: string
    image: string
    images?: string[]
    benefits: string[]
    features?: string[]
    price?: string
    duration?: string
    category?: string
    tags?: string[]
    order?: number
    isPopular?: boolean
    ctaText?: string
    ctaLink?: string
    richContentNodes?: any[]
}

const ShimmerEffect = ({ className = "" }: { className?: string }) => (
    <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
)

const ModernSkeleton = () => (
    <section className="relative bg-white md:py-10" id="Services">
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-2">
                    <ShimmerEffect className="h-10 w-64" />
                    <ShimmerEffect className="h-4 w-48" />
                </div>
                <div className="hidden md:flex gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xs border border-gray-100 shadow-sm h-[620px]">
                        <ShimmerEffect className="w-full h-44 rounded-t-xs" />
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
                                        <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
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
)

export default function Services() {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const openModal = (service: Service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<"static" | "wix">("static");

    const processWixImageUrl = (item: any): string => {
        const bestImage = getBestCoverImage(item);
        if (bestImage) {
            return bestImage;
        }

        const imageFields = ["image", "photo", "picture", "mainImage", "featuredImage", "coverImage", "thumbnail"];

        for (const field of imageFields) {
            if (item[field]) {
                let imageUrl = null;

                if (typeof item[field] === "string" && item[field].startsWith("wix:image://")) {
                    imageUrl = item[field];
                } else if (item[field]?.url && item[field].url.startsWith("wix:image://")) {
                    imageUrl = item[field].url;
                } else if (item[field]?.src && item[field].src.startsWith("wix:image://")) {
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

    const parseRichContent = (content: any): { text: string; nodes?: any[] } => {
        if (!content) return { text: "" };

        // Handle simple string content
        if (typeof content === "string") {
            return { text: content };
        }

        // Handle Wix rich content structure
        if (content.nodes && Array.isArray(content.nodes)) {
            const extractedText = extractTextFromNodes(content.nodes);
            return {
                text: extractedText,
                nodes: content.nodes,
            };
        }

        // Handle other formats
        if (content.html) {
            return { text: content.html };
        }

        if (content.plainText) {
            return { text: content.plainText };
        }

        if (content.text) {
            return { text: content.text };
        }

        return { text: "" };
    };

    const extractTextFromNodes = (nodes: any[]): string => {
        let text = "";

        for (const node of nodes) {
            if (node.type === "TEXT" && node.textData?.text) {
                text += node.textData.text;
            } else if (node.type === "PARAGRAPH" && node.nodes) {
                text += extractTextFromNodes(node.nodes) + " ";
            } else if (node.type === "LIST_ITEM" && node.nodes) {
                text += "• " + extractTextFromNodes(node.nodes) + " ";
            } else if (node.type === "BULLETED_LIST" && node.nodes) {
                text += extractTextFromNodes(node.nodes);
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
                if (node.type === "LIST_ITEM" && node.nodes) {
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

        if (typeof field === "string") {
            return field
                .split(/[,\n]/)
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return fallback;
    };

    const fetchServices = async () => {
        try {
            const { wixClient } = await import("@/lib/wixClient");

            const response = await wixClient.items
                .query(COLLECTION_ID)
                .skip(0)
                .limit(100)
                .descending("_createdDate")
                .find({ consistentRead: true });

            if (!response?.items?.length) {
                return [];
            }

            const servicesData: Service[] = response.items.map((item: any, originalIndex: number) => {
                const parsedRichContent = parseRichContent(item.richcontent || item.richContent);
                const parsedDescription = parseRichContent(item.description);

                const richContentBenefits = extractBenefitsFromRichContent(item.richcontent || item.richContent);
                const fallbackBenefits = parseArrayField(item.benefits, [
                    "Professional service",
                    "Expert care",
                    "Quality assured",
                ]);

                return {
                    _id: item._id || item.ID,
                    title: item.title || item.name || item.serviceName || "Service",
                    description: parsedDescription.text || "Service description",
                    richContent: parsedRichContent.text,
                    richContentNodes: parsedRichContent.nodes,
                    shortDescription: parseRichContent(item.shortDescription || item.summary).text,
                    image: processWixImageUrl(item),
                    images: item.images
                        ? parseArrayField(item.images).map((img: any) => processWixImageUrl({ image: img }))
                        : undefined,
                    benefits: richContentBenefits.length > 0 ? richContentBenefits : fallbackBenefits,
                    features: parseArrayField(item.features),
                    price: item.price || item.cost || item.pricing,
                    duration: item.duration || item.timeRequired || item.estimatedTime,
                    category: item.category || item.serviceCategory || item.type,
                    tags: parseArrayField(item.tags),
                    order: Number.parseInt(item.order) || Number.parseInt(item.Order) || originalIndex,
                    isPopular: item.isPopular || item.featured || item.popular || false,
                    ctaText: item.ctaText || item.buttonText || "Enquire Now",
                    ctaLink: item.ctaLink || item.bookingLink || item.contactLink,
                };
            });

            return servicesData.sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (error: any) {
            console.error("[v0] Wix API Error:", error);
            throw error;
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchServices();

            if (result.length > 0) {
                setServices(result);
                setDataSource("wix");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const truncateText = (text: string, maxLength = 150) => {
        if (!text) return "";

        const plainText = text.replace(/<[^>]*>/g, "");

        if (plainText.length <= maxLength) return text;

        const truncated = plainText.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(" ");
        const finalLength = lastSpace > maxLength * 0.8 ? lastSpace : maxLength;

        return plainText.substring(0, finalLength).trim() + "...";
    };

    // New ServiceCard component that accepts `onOpenModal` as a prop
    const ServiceCard = ({ service }: { service: Service }) => (
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
                    <h3 className="title-text">{service.title}</h3>
                </div>
                <div className="md:mb-4 mb-5 flex-grow h-">
                    <p className="description">
                        {service.shortDescription || service.description}
                    </p>
                </div>
                <div className="mb-3">
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
                <div className="mt-auto pt-0 md:pt-2 pl-8 w-full md:pl-7 text-left">
                    {/* Updated onClick to use the correct function */}
                    <Button
                        className="inline-flex items-center w-full justify-center whitespace-nowrap rounded-xs md:text-base text-sm md:text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer border bg-background w-auto hover:text-accent-foreground h-10 px-4 py-2 border-gray-200 text-[#241d1f] hover:bg-gray-50 left-4 right-4 mb-3"
                        onClick={() => openModal(service)}
                    >
                        {service.ctaText || 'Enquire Now'}
                        {/* <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /> */}
                    </Button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <ModernSkeleton />;
    }

    if (services.length === 0) {
        return (
            <section className="relative bg-white md:py-10" id="Services">
                <div className="container mx-auto">
                    <div className="text-center max-w-2xl mx-auto py-12">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-purple-100 rounded-full mb-8">
                            <Briefcase className="h-12 w-12 text-red-600" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
                            Our Services
                        </h2>
                        <p className="text-lg text-[#241d1f]">
                            Our services information is currently being updated. Check back soon!
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <Banner
                topSpanText="Our Services"
                title="Comprehensive Healthcare Solutions Tailored for You"
                description="At Medivisor, we make healthcare in India simple, reliable, and stress-free for international patients. From specialized treatments to general wellness, we connect you with the best healthcare providers in India. From the moment you reach out to us, we guide you at every step — so you can focus on your recovery while we take care of the rest."
                buttonText="Connect Us"
                buttonLink="/services#list"
                mainImageSrc="/about-main.png"
                mainImageAlt="Doctor providing expert medical guidance"
                bannerBgImage="/bg-about.png"
            />
            <section className="relative bg-gray-50 px-2 md:px-0 py-12 md:py-16" id="Services">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-4">
                        {services.map((service, index) => (
                            // Pass openModal down as a prop
                            <ServiceCard key={service._id || index} service={service} />
                        ))}
                    </div>
                </div>
            </section>
            <CtaSection />
            {/* Pass the selected service data to the modal */}
            <ContactModal isOpen={isModalOpen} onClose={closeModal}/>
        </>
    );
}