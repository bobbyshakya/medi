import React from "react"
import ContactForm from "@/components/ContactForm"
import { Inter } from "next/font/google"
import { extractUniqueTreatments, getBranchImage, getHospitalImage, getHospitalLogo, getWixImageUrl, generateSlug, fetchHospitalBySlug } from "./utils"
import HeroSection from "./components/HeroSection"
import Breadcrumb from "./components/Breadcrumb"
import OverviewSection from "./components/OverviewSection"
import AboutSection from "./components/AboutSection"
import FacilitiesSection from "./components/FacilitiesSection"
import CarouselSection from "./components/CarouselSection"
import SimilarHospitalsSection from "./components/SimilarHospitalsSection"
import ErrorState from "./components/ErrorState"

// Client component for interactive carousels
function InteractiveCarouselSection({ title, items, type, searchPlaceholder }: {
  title: string;
  items: any[];
  type: "doctor" | "treatment";
  searchPlaceholder: string;
}) {
  return (
    <CarouselSection
      title={title}
      items={items}
      type={type}
      searchPlaceholder={searchPlaceholder}
    />
  );
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

// Enable ISR with revalidation
export const revalidate = 3600; // Revalidate every hour

async function fetchHospitalData(slug: string) {
  try {
    // Use the improved fetchHospitalBySlug function for better Wix CMS data fetching
    const hospitalData = await fetchHospitalBySlug(slug);
    return hospitalData;
  } catch (error) {
    console.error('Error fetching hospital data:', error);
    return null;
  }
}

export default async function BranchDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch hospital data on server
  const hospitalData = await fetchHospitalData(slug);

  if (!hospitalData || typeof hospitalData !== 'object') {
    return <ErrorState error="Hospital not found. The URL might be incorrect or the hospital does not exist." />
  }

  // Validate required fields
  if (!hospitalData.hospitalName && !hospitalData.branches?.length) {
    return <ErrorState error="Invalid hospital data structure. Please try again later." />
  }

  // Find the matching branch
  let foundBranch = null;

  // If the hospital has branches, find the one that matches the slug
  if (Array.isArray(hospitalData.branches) && hospitalData.branches.length > 0) {
    foundBranch = hospitalData.branches.find((b: any) => {
      if (!b?.branchName || typeof b.branchName !== 'string') return false;
      const expectedBranchSlug = generateSlug(b.branchName);
      return expectedBranchSlug === slug ||
             b.branchName.toLowerCase().includes(slug.replace(/-/g, ' '));
    });
  }

  // If no branch found but there's exactly one branch, use it (common for standalone hospitals)
  if (!foundBranch && Array.isArray(hospitalData.branches) && hospitalData.branches.length === 1) {
    foundBranch = hospitalData.branches[0];
  }

  // If still no branch found but hospital is standalone, create a branch from hospital data
  if (!foundBranch && hospitalData.isStandalone) {
    foundBranch = {
      ...hospitalData,
      branchName: hospitalData.hospitalName || 'Main Branch',
      address: hospitalData.address || '',
      city: Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.city ? hospitalData.branches[0].city : [],
      specialization: Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.specialization ? hospitalData.branches[0].specialization : [],
      description: hospitalData.description || '',
      totalBeds: (Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.totalBeds) || '',
      noOfDoctors: (Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.noOfDoctors) || '',
      yearEstablished: hospitalData.yearEstablished || '',
      branchImage: hospitalData.hospitalImage,
      doctors: Array.isArray(hospitalData.doctors) ? hospitalData.doctors : [],
      specialists: Array.isArray(hospitalData.specialists) ? hospitalData.specialists : [],
      treatments: Array.isArray(hospitalData.treatments) ? hospitalData.treatments : [],
      accreditation: Array.isArray(hospitalData.accreditation) ? hospitalData.accreditation : [],
      _id: hospitalData.originalBranchId || hospitalData._id
    };
  }

  // If still no branch found, check if slug matches hospital name (for multi-branch hospitals)
  if (!foundBranch && hospitalData.hospitalName && (generateSlug(hospitalData.hospitalName) === slug || slug.startsWith(generateSlug(hospitalData.hospitalName) + '-'))) {
    foundBranch = {
      branchName: hospitalData.hospitalName,
      address: hospitalData.address || '',
      city: Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.city ? hospitalData.branches[0].city : [],
      specialization: Array.isArray(hospitalData.branches) && hospitalData.branches[0]?.specialization ? hospitalData.branches[0].specialization : [],
      description: hospitalData.description || '',
      totalBeds: '',
      noOfDoctors: '',
      yearEstablished: hospitalData.yearEstablished || '',
      branchImage: hospitalData.hospitalImage,
      doctors: Array.isArray(hospitalData.doctors) ? hospitalData.doctors : [],
      specialists: Array.isArray(hospitalData.specialists) ? hospitalData.specialists : [],
      treatments: Array.isArray(hospitalData.treatments) ? hospitalData.treatments : [],
      accreditation: Array.isArray(hospitalData.accreditation) ? hospitalData.accreditation : [],
      _id: hospitalData._id
    };
  }

  if (!foundBranch || typeof foundBranch !== 'object') {
    return <ErrorState error="Branch not found within the hospital." />;
  }

  const hospital = hospitalData;
  const branch = foundBranch;
  
  // Calculate derived data with validation
  // For group hospitals (multiple branches), collect treatments from ALL branches
  const isGroupHospital = Array.isArray(hospitalData.branches) && hospitalData.branches.length > 1
  
  // Use enriched treatments from hospital level (already mapped with all fields)
  // Fall back to extracting from branches if hospital.treatments is empty
  const hospitalTreatments = hospitalData?.treatments || []
  
  // For group hospitals, use enriched treatments from hospital level
  // For single branch, extract from branch + specialists
  const allTreatments = isGroupHospital
    ? hospitalTreatments  // Use pre-enriched treatments from hospital
    : (branch ? extractUniqueTreatments(branch) : [])
  
  // Debug: log treatment counts
  console.log('Treatment debug:', {
    isGroupHospital,
    hospitalTreatmentsCount: hospitalTreatments.length,
    allTreatmentsCount: allTreatments.length
  })
  
  // Build unified specialists list from all branches for group hospitals
  const allSpecialists = (() => {
    if (isGroupHospital) {
      const specialistsMap = new Map()
      hospitalData.branches?.forEach((b: any) => {
        b.specialists?.forEach((s: any) => {
          if (s._id && !specialistsMap.has(s._id)) {
            specialistsMap.set(s._id, { ...s, branchName: b.branchName })
          }
        })
      })
      return Array.from(specialistsMap.values())
    }
    return branch?.specialists || []
  })()
  
  // Build unified doctors list from all branches for group hospitals
  const allDoctors = (() => {
    if (isGroupHospital) {
      const doctorsMap = new Map()
      hospitalData.branches?.forEach((b: any) => {
        b.doctors?.forEach((d: any) => {
          if ((d._id || d.doctorName) && !doctorsMap.has(d._id || d.doctorName)) {
            doctorsMap.set(d._id || d.doctorName, { ...d, branchName: b.branchName })
          }
        })
      })
      return Array.from(doctorsMap.values())
    }
    return branch?.doctors || []
  })()
  const sortedFacilities = (() => {
    if (!branch?.facilities || !Array.isArray(branch.facilities)) return [];
    return [...branch.facilities]
      .filter(facility => facility && typeof facility === 'object')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  })();
  const currentCity = Array.isArray(branch?.city) && branch.city[0]?.cityName ? branch.city[0].cityName : null;
  const isDelhiNCR = currentCity && ['delhi', 'gurugram', 'gurgaon', 'noida', 'faridabad', 'ghaziabad'].some(city =>
    currentCity.toLowerCase().includes(city.toLowerCase())
  );
  const displayCityName = isDelhiNCR ? 'Delhi NCR' : (currentCity || 'Nearby Locations');



  const accreditationImages = (() => {
    const images = [];
    if (Array.isArray(branch?.accreditation) && branch.accreditation.length > 0) {
      images.push(...branch.accreditation
        .filter((acc: any) => acc && typeof acc === 'object')
        .map((acc: any) => ({
          image: getWixImageUrl(acc.image),
          title: acc.title || 'Accreditation',
          _id: acc._id
        }))
        .filter((acc: any) => acc.image));
    }
    if (Array.isArray(hospital?.accreditation) && hospital.accreditation.length > 0) {
      images.push(...hospital.accreditation
        .filter((acc: any) => acc && typeof acc === 'object')
        .map((acc: any) => ({
          image: getWixImageUrl(acc.image),
          title: acc.title || 'Accreditation',
          _id: acc._id
        }))
        .filter((acc: any) => acc.image));
    }
    return images;
  })();

  const branchImage = getBranchImage(branch.branchImage)
  const hospitalImage = getHospitalImage(hospital.hospitalImage)
  const heroImage = branchImage || hospitalImage
  const hospitalLogo = getHospitalLogo(hospital.logo)
  const hospitalSlug = generateSlug(hospital.hospitalName)
  const firstSpecialityName = branch.specialization?.[0]?.name || 'N/A'

  return (
    <div className={`min-h-screen bg-white ${inter.variable} font-light`}>
      <HeroSection
        heroImage={heroImage}
        branch={branch}
        hospital={hospital}
        hospitalLogo={hospitalLogo}
        accreditationImages={accreditationImages}
      />
      <Breadcrumb hospitalName={hospital.hospitalName} branchName={branch.branchName} hospitalSlug={hospitalSlug} />
      <main className="py-10 w-full relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="md:grid lg:grid-cols-12 gap-4 md:gap-8">
            <div className="lg:col-span-9 space-y-4">
              <OverviewSection branch={branch} firstSpecialityName={firstSpecialityName} />
              {branch.description && <AboutSection description={branch.description} hospitalName={hospital.hospitalName} hospitalSlug={hospitalSlug} />}
              {sortedFacilities.length > 0 && <FacilitiesSection facilities={sortedFacilities} />}
              {allTreatments.length > 0 && <InteractiveCarouselSection title="Available Treatments" items={allTreatments} type="treatment" searchPlaceholder="Search treatments by name or specialist..." />}
              {(isGroupHospital ? allDoctors.length > 0 : branch.doctors?.length > 0) && (
                <InteractiveCarouselSection 
                  title="Our Specialist Doctors" 
                  items={isGroupHospital ? allDoctors : branch.doctors} 
                  type="doctor" 
                  searchPlaceholder="Search doctors by name or Speciality..." 
                />
              )}
              <SimilarHospitalsSection 
                currentHospitalId={hospital._id} 
                currentBranchId={branch._id} 
                currentCity={currentCity} 
                displayCityName={displayCityName}
                allHospitals={hospitalData.allHospitals}
              />
            </div>
            <aside className="lg:col-span-3 space-y-8"><ContactForm /></aside>
          </div>
        </div>
      </main>
    </div>
  )
}