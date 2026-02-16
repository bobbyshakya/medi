// src/app/api/doctor-profile/route.ts
// API route to get doctor profile by slug from Wix CMS

import { NextResponse } from "next/server";
import { getDoctorBySlug, getAllCMSData } from '@/lib/cms';

// Data structure interface
export interface DoctorProfile {
    _id: string;
    name: string;
    title: string;
    specialty: string;
    photo: string;
    experience: string;
    languages: string[];
    hospitals: string[];
    contactPhone: string;
    whatsapp: string;
    rating: number;
    reviewsCount: number;
    about: string;
    workExperience: Array<{
        position: string;
        organization: string;
        period: string;
    }>;
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    memberships: string[];
    awards: Array<{
        title: string;
        year: string;
        organization: string;
    }>;
    specialtyInterests: string[];
    faqs: Array<{
        q: string;
        a: string;
    }>;
    testimonials: Array<{
        id: number;
        name: string;
        rating: number;
        text: string;
    }>;
}

/**
 * Generate slug from doctor name
 */
function generateSlug(name: string): string {
    if (!name) return ''
    return name
        .toLowerCase()
        .trim()
        .replace(/^(dr\.?\s*)/i, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}

/**
 * Convert CMS doctor data to profile format
 */
function convertToProfile(doctor: any, hospitalName: string): DoctorProfile {
    const specNames = doctor.specialization?.map((s: any) => s.name).join(', ') || 'Specialist'
    
    return {
        _id: doctor._id || '',
        name: doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Doctor',
        title: doctor.designation || specNames,
        specialty: specNames,
        photo: doctor.profileImage || '',
        experience: doctor.experienceYears || '0',
        languages: ['English', 'Hindi'],
        hospitals: hospitalName ? [hospitalName] : [],
        contactPhone: '',
        whatsapp: '',
        rating: 0,
        reviewsCount: 0,
        about: doctor.aboutDoctor || doctor.aboutDoctorHtml || '',
        workExperience: [],
        education: [],
        memberships: [],
        awards: [],
        specialtyInterests: [],
        faqs: [],
        testimonials: [],
    }
}

/**
 * GET handler for fetching doctor profile by slug
 * Query params: ?slug=doctor-slug
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
        return NextResponse.json(
            { error: 'Missing slug parameter' },
            { status: 400 }
        );
    }
    
    try {
        // First try to get doctor directly from CMS
        const doctor = await getDoctorBySlug(slug);
        
        if (!doctor) {
            // Fallback: try to find from all CMS data
            const { hospitals } = await getAllCMSData();
            
            // Search through hospitals for the doctor
            let foundDoctor = null;
            let hospitalName = '';
            
            for (const hospital of hospitals || []) {
                // Check main hospital doctors
                for (const d of hospital.doctors || []) {
                    const doctorSlug = generateSlug(d.doctorName);
                    if (doctorSlug === slug || doctorSlug === slug.toLowerCase()) {
                        foundDoctor = d;
                        hospitalName = hospital.hospitalName;
                        break;
                    }
                }
                
                // Check branch doctors
                if (!foundDoctor) {
                    for (const branch of hospital.branches || []) {
                        for (const d of branch.doctors || []) {
                            const doctorSlug = generateSlug(d.doctorName);
                            if (doctorSlug === slug || doctorSlug === slug.toLowerCase()) {
                                foundDoctor = d;
                                hospitalName = branch.branchName || hospital.hospitalName;
                                break;
                            }
                        }
                        if (foundDoctor) break;
                    }
                }
                
                if (foundDoctor) break;
            }
            
            if (!foundDoctor) {
                return NextResponse.json(
                    { error: 'Doctor not found' },
                    { status: 404 }
                );
            }
            
            // Convert to profile format
            const profile = convertToProfile(foundDoctor, hospitalName);
            return NextResponse.json(profile);
        }
        
        // Get hospital info for this doctor
        const { hospitals } = await getAllCMSData();
        const doctorHospitals: string[] = [];
        
        hospitals?.forEach((h: any) => {
            // Check main hospital
            h.doctors?.forEach((d: any) => {
                if (d._id === doctor._id) {
                    doctorHospitals.push(h.hospitalName);
                }
            });
            // Check branches
            h.branches?.forEach((b: any) => {
                b.doctors?.forEach((d: any) => {
                    if (d._id === doctor._id) {
                        doctorHospitals.push(b.branchName || h.hospitalName);
                    }
                });
            });
        });
        
        const profile = convertToProfile(doctor, doctorHospitals.join(', '));
        return NextResponse.json(profile);
        
    } catch (error) {
        console.error('[doctor-profile API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctor profile' },
            { status: 500 }
        );
    }
}
