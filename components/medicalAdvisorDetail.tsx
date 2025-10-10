import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { wixServerClient } from "@/lib/wixServer";
import { getBestCoverImage } from "@/lib/wixMedia";
import { OptimizedImage } from "@/components/optimized-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  MessageCircle,
  MapPin,
  GraduationCap,
  Award,
  Briefcase,
  Languages,
  Stethoscope,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";
import type { MedicalAdvisor } from "@/types/medicalAdvisor";
import { ReadMoreButton } from "@/components/read-more-button"; // New import

const COLLECTION_ID = "Import2";

interface PageProps {
  params: {
    slug: string;
  };
}

// Function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper function to format specialty interests
function formatSpecialtyInterests1yy(data: any): string[] | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map((item) => item.trim());
  }
  if (typeof data === "string") {
    return data.split(",").map((item) => item.trim());
  }
  return null;
}

// Function to fetch doctor by slug
async function getDoctorBySlug(slug: string): Promise<MedicalAdvisor | null> {
  try {
    let response = await wixServerClient.items
      .query(COLLECTION_ID)
      .eq("slug", slug)
      .limit(1)
      .find({ consistentRead: true });

    if (response.items && response.items.length > 0) {
      const item = response.items[0];
      return {
        _id: item._id,
        name: item.name || "Medical Advisor",
        title: item.Title || item.title,
        specialty: item.specialty,
        photo: item.photo,
        experience: item.experience,
        languages: item.languages,
        hospitals: item.hospitals,
        contactPhone: item.contactPhone,
        whatsapp: item.whatsapp,
        about: item.about,
        workExperience: item.workExperience,
        education: item.education,
        memberships: item.memberships,
        awards: item.awards,
        specialtyInterests1yy: formatSpecialtyInterests1yy(item.specialtyInterests1yy),
        slug: item.slug,
      } as MedicalAdvisor;
    }

    // Fallback if slug is not in the database (less efficient)
    response = await wixServerClient.items
      .query(COLLECTION_ID)
      .limit(100)
      .find({ consistentRead: true });

    if (!response.items) {
      return null;
    }

    const doctor = response.items.find((item: any) => {
      const generatedSlug = createSlug(item.name || "");
      return generatedSlug === slug;
    });

    if (doctor) {
      return {
        _id: doctor._id,
        name: doctor.name || "Medical Advisor",
        title: doctor.Title || doctor.title,
        specialty: doctor.specialty,
        photo: doctor.photo,
        experience: doctor.experience,
        languages: doctor.languages,
        hospitals: doctor.hospitals,
        contactPhone: doctor.contactPhone,
        whatsapp: doctor.whatsapp,
        about: doctor.about,
        workExperience: doctor.workExperience,
        education: doctor.education,
        memberships: doctor.memberships,
        awards: doctor.awards,
        specialtyInterests1yy: formatSpecialtyInterests1yy(doctor.specialtyInterests1yy),
        slug: doctor.slug,
      } as MedicalAdvisor;
    }

    return null;
  } catch (error) {
    console.error("Error fetching doctor by slug:", error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const doctor = await getDoctorBySlug(params.slug);

  if (!doctor) {
    return {
      title: "Doctor Not Found | Medivisor India",
      description: "The requested doctor profile could not be found.",
    };
  }

  const doctorName = doctor.name || "Medical Advisor";
  const specialty = doctor.specialty || "Medical Specialist";
  const specialtyInterests1yy = doctor.specialtyInterests1yy?.join(", ") || "";

  return {
    title: `${doctorName} - ${specialty} | Medivisor India`,
    description: `Meet ${doctorName}, ${specialty} at Medivisor India. ${
      doctor.about ? doctor.about.substring(0, 160) + "..." : `Expert medical advisor with ${doctor.experience || "extensive"} experience.`
    }`,
    keywords: `${doctorName}, ${specialty}, Medivisor India, medical advisor, healthcare India, ${specialtyInterests1yy}`,
    openGraph: {
      title: `${doctorName} - ${specialty}`,
      description: `Expert medical advisor at Medivisor India with ${doctor.experience || "extensive"} experience in ${specialty}.`,
      images: doctor.photo ? [{ url: doctor.photo, width: 800, height: 600, alt: doctorName }] : [],
    },
  };
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const doctor = await getDoctorBySlug(params.slug);

  if (!doctor) {
    notFound();
  }

  const imageUrl = getBestCoverImage(doctor) || doctor.photo;
  const aboutText = doctor.about || "";
  const specialtyInterests1yy = Array.isArray(doctor.specialtyInterests1yy) ? doctor.specialtyInterests1yy : [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ... (Hero Section is not in the provided code, but the comment is) */}
      
      {/* Content Section */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4 md:px-0">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Sticky Sidebar with Image and Contact */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 self-start space-y-6 hidden lg:block">
              {/* Image Card for larger screens */}
              <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 p-4">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={doctor.name || "Medical Advisor"}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-200">
                      <Stethoscope className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick Info */}
              <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                <CardHeader className="px-5 py-4">
                  <CardTitle className="title-text">Quick Information</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-4">
                  {doctor.experience && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="description-1 font-medium">Experience</p>
                        <p className="description text-[#241d1f]">{doctor.experience} Years</p>
                      </div>
                    </div>
                  )}

                  {doctor.languages && (
                    <div className="flex items-center gap-3">
                      <Languages className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="description-1 font-medium">Languages</p>
                        <p className="description text-[#241d1f]">{doctor.languages}</p>
                      </div>
                    </div>
                  )}

                  {doctor.hospitals && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="description-1 font-medium">Hospitals</p>
                        <p className="description text-[#241d1f]">{doctor.hospitals}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Specialty Interests */}
              {specialtyInterests1yy.length > 0 && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      Specialty Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="flex flex-wrap gap-2">
                      {specialtyInterests1yy.map((interest, index) => (
                        <Badge key={index} variant="outline" className="border-gray-200 text-[#241d1f] hover:bg-gray-50">
                          {interest.trim()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Awards */}
              {doctor.awards && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      Awards & Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="description">{doctor.awards}</p>
                  </CardContent>
                </Card>
              )}

              {/* Memberships */}
              {doctor.memberships && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text">Professional Memberships</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-2">
                      {doctor.memberships.split(",").map((membership, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="description">{membership.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200 shadow-none ring-1 ring-blue-200">
                <CardHeader className="px-5 py-4">
                  <CardTitle className="title-text text-blue-800">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-3">
                  {doctor.contactPhone && (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white font-semibold"
                      size="sm"
                    >
                      <a href={`tel:${doctor.contactPhone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        {doctor.contactPhone}
                      </a>
                    </Button>
                  )}
                  {doctor.whatsapp && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full bg-transparent border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                      size="sm"
                    >
                      <a
                        href={`https://wa.me/${doctor.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* About */}
              {doctor.about && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      About Dr. {doctor.name?.split(" ").pop()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <ReadMoreButton text={aboutText} />
                  </CardContent>
                </Card>
              )}

              {/* Work Experience */}
              {doctor.workExperience && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Professional Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-3">
                      {doctor.workExperience.split(",").map((experience, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="description">{experience.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {doctor.education && (
                <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="title-text flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      Education & Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="space-y-3">
                      {doctor.education.split(",").map((edu, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="description">{edu.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Specialty Interests, Awards, and Memberships (moved from sidebar) */}
              <div className="space-y-6 lg:hidden">
                {specialtyInterests1yy.length > 0 && (
                  <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                    <CardHeader className="px-5 py-4">
                      <CardTitle className="title-text flex items-center gap-2">
                        <Star className="h-4 w-4 text-blue-600" />
                        Specialty Interests
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="flex flex-wrap gap-2">
                        {specialtyInterests1yy.map((interest, index) => (
                          <Badge key={index} variant="outline" className="border-gray-200 text-[#241d1f] hover:bg-gray-50">
                            {interest.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {doctor.awards && (
                  <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                    <CardHeader className="px-5 py-4">
                      <CardTitle className="title-text flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        Awards & Recognition
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <p className="description">{doctor.awards}</p>
                    </CardContent>
                  </Card>
                )}

                {doctor.memberships && (
                  <Card className="border-gray-100 shadow-none ring-1 ring-gray-100 transition-all duration-300 hover:shadow-sm hover:ring-primary/50">
                    <CardHeader className="px-5 py-4">
                      <CardTitle className="title-text">Professional Memberships</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <div className="space-y-2">
                        {doctor.memberships.split(",").map((membership, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="description">{membership.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Back to Advisors */}
          <div className="mt-12 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-gray-300 text-[#241d1f] hover:bg-gray-50 font-semibold bg-transparent"
            >
              <Link href="/medical-advisors">← Back to All Medical Advisors</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}