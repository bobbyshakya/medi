'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { FaFacebookF, FaYoutube, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import ContactModal from '@/components/ContactModal';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import BranchFilter from "@/components/BranchFilter";

// =================================================================
// Data Types
// =================================================================

interface City {
  _id: string;
  cityName: string;
}

interface Treatment {
  _id: string;
  name: string;
}

interface Specialization {
  _id: string;
  name: string;
}

interface Doctor {
  _id: string;
  doctorName: string;
  specialization: (Specialization | string)[];
}

interface Branch {
  _id: string;
  branchName: string;
  city: City[];
  treatments: Treatment[];
  doctors: Doctor[];
  specialists?: any[];
}

interface Hospital {
  _id: string;
  hospitalName: string;
  treatments?: Treatment[];
  doctors?: Doctor[];
  branches: Branch[];
}

// =================================================================
// Data Fetching
// =================================================================

// 1. Define the expected shape of the API response (assuming the API returns an object 
//    containing an 'items' array).
interface HospitalAPIResponse {
  items: Hospital[];
  totalCount?: number; // Optional: include other properties if they exist
}

async function fetchMasterHospitalData(): Promise<Hospital[]> {
  // Use a `try...catch` block to handle errors more cleanly, 
  // though the existing `if (!response.ok)` handles server errors well.
  
  const response = await fetch('/api/hospitals?pageSize=50', { 
    cache: 'no-store'
  });

  if (!response.ok) {
    // 👇 The error handling is already good, keep it robust
    const errorBody = await response.text();
    console.error("API Response Status:", response.status);
    console.error("API Response Body:", errorBody);
    throw new Error(`Failed to fetch hospital data: ${response.statusText}. Response body: ${errorBody.substring(0, 100)}`);
  }

  // 2. Add type assertion for the JSON response for better type safety
  const data: HospitalAPIResponse = await response.json();
  
  // 3. Ensure `data` is an object and has an `items` property before returning
  if (!data || !Array.isArray(data.items)) {
      console.error("API response structure is invalid:", data);
      throw new Error("Invalid data structure received from hospital API.");
  }
  
  return data.items;
}

// =================================================================
// Navigation Data
// =================================================================

const navItems = [
  { href: '/', label: 'Home' },
  {
    label: 'About Us',
    subItems: [
      { href: '/aboutus', label: 'About Us' },
      { href: '/services', label: 'Our Services' },
      { href: '/team', label: 'Our Team' },
      { href: '/medical-advisors', label: 'Our Medical Advisors' },
      { href: '/hospital-network', label: 'Our Hospital Network' },
      { href: '/safety-measures', label: 'Our Safety Measures' },
    ],
  },
  {
    label: 'India Treatment',
    subItems: [
      { href: '/treatment-cost', label: 'Treatment Cost' },
      { href: '/treatment-process', label: 'Treatment Process' },
      { href: '/visa-process', label: 'Visa Process' },
      { href: '/travel-guide', label: 'Travel Guide' },
      { href: '/faqs', label: 'FAQs' },
      { href: '/why-medivisor', label: 'Why Medivisor' },
    ],
  },
  {
    label: 'Gallery',
    subItems: [
      { href: '/patient-testimonials', label: 'Patient Testimonials' },
      { href: '/photo-albums', label: 'Patient Activities' },
      { href: '/media-coverage', label: 'News Coverage' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  { href: '/contact', label: 'Contact Us' },
];

const socialLinks = [
  {
    href: "https://www.facebook.com/medivisorindiatreatment",
    icon: FaFacebookF,
    title: "Facebook",
    className: "bg-blue-600"
  },
  {
    href: "https://www.youtube.com/@medivisorindiatreatment",
    icon: FaYoutube,
    title: "YouTube",
    className: "bg-red-600"
  },
  {
    href: "https://www.instagram.com/medivisorindiatreatment",
    icon: FaInstagram,
    title: "Instagram",
    className: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
  },
  {
    href: "https://wa.me/918340780250",
    icon: FaWhatsapp,
    title: "Chat on WhatsApp",
    className: "bg-green-500"
  }
];

// =================================================================
// Main Component
// =================================================================

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();

  // Scroll handler
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Window width handler
  useEffect(() => {
    const updateWindowWidth = () => setWindowWidth(window.innerWidth);
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  // Data fetching
  useEffect(() => {
    fetchMasterHospitalData()
      .then(setAllHospitals)
      .catch(error => {
        console.error("Failed to fetch hospital data for header filter:", error); // Updated log message
      });
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmenuToggle = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const handleSubmenuHover = (label: string) => {
    if (windowWidth >= 768) {
      setOpenSubmenu(openSubmenu === label ? null : label);
    }
  };

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 w-full z-50 bg-white transition-all duration-300 ease-in-out ${isScrolled ? 'py-2 shadow-xs' : 'py-3 shadow-xs'
          }`}
      >
        <nav className="flex justify-between container mx-auto items-center px-4 lg:px-0">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 w-[200px] ">
            <Image
              src="/Medivisor-logo.svg"
              alt="Medivisor India Treatment Logo"
              width={220}
              height={55}
              className={`w-full object-contain transition-all duration-300 ${isScrolled ? 'h-14' : 'h-14'
                }`}
              priority // Add this line
            />
          </Link>

          {/* Navigation */}
          <div className="flex w-full md:ml-10 items-center justify-between gap-4">
            <div
              className={`fixed inset-0 w-full bg-white md:static md:bg-transparent transition-transform duration-500 ease-in-out md:translate-x-0 md:flex md:items-center md:gap-8 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } z-40`}
            >
              {/* Mobile Header */}
              <div className="flex justify-between w-full items-center px-4 py-4 md:hidden border-b border-gray-200">
                <Image
                  src="/Medivisor-logo.svg"
                  alt="Medivisor India Treatment Logo"
                  width={180}
                  height={45}
                  className="h-12 w-auto object-contain"
                />
                <button
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                  aria-label="Close menu"
                >
                  <X size={28} />
                </button>
              </div>

              {/* <BranchFilter allHospitals={allHospitals} /> */}

              {/* Navigation Items */}
              <ul className="flex w-full flex-col md:flex-row gap-2 md:gap-8 px-6 md:px-0 pt-6 md:pt-0">
                {navItems.map((item) => (
                  <li
                    key={item.label}
                    className="relative group font-medium text-[#241d1f] hover:text-[#E22026] transition-colors"
                    onMouseEnter={() => item.subItems && handleSubmenuHover(item.label)}
                    onMouseLeave={() => item.subItems && windowWidth >= 768 && setOpenSubmenu(null)}
                  >
                    <div className="flex items-center justify-between">
                      {item.subItems ? (
                        <span
                          className="py-2 px-0 cursor-default select-none text-xl md:text-base"
                          onClick={() => windowWidth < 768 && handleSubmenuToggle(item.label)}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <Link
                          href={item.href!}
                          className="py-2 px-0 rounded hover:text-[#E22026] transition-colors text-lg md:text-base"
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      )}

                      {item.subItems && (
                        <ChevronDown
                          size={18}
                          className={`ml-1 text-gray-500 cursor-pointer transition-transform duration-300 ${openSubmenu === item.label ? 'rotate-180' : ''
                            } md:group-hover:rotate-180`}
                          onClick={() => handleSubmenuToggle(item.label)}
                        />
                      )}
                    </div>

                    {/* Submenu */}
                    {item.subItems && (
                      <ul
                        className={`transition-all duration-300 ease-in-out overflow-hidden md:absolute md:top-full md:left-0 md:bg-white md:shadow-md md:rounded-md md:py-2 md:min-w-[220px] md:opacity-0 md:invisible md:scale-95 md:group-hover:opacity-100 md:group-hover:visible md:group-hover:scale-100 ${openSubmenu === item.label ? 'max-h-screen md:max-h-fit' : 'max-h-0 md:max-h-fit'
                          }`}
                      >
                        {item.subItems.map((subItem) => (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              className="block px-4 py-2 text-lg md:text-base text-[#241d1f] hover:bg-gray-100 hover:text-[#E22026] transition"
                              onClick={closeMobileMenu}
                            >
                              {subItem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              {/* Mobile Social Links */}
              <div className="flex gap-4 mt-8 px-6 md:hidden absolute bottom-4 w-full border-t border-gray-200 pt-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.title}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.title}
                    className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-md hover:scale-110 transition-transform ${social.className}`}
                  >
                    <social.icon size={22} />
                  </a>
                ))}
              </div>
            </div>

            {/* CTA & Mobile Menu Toggle */}
            <div className="flex w-full md:w-1/6 items-center justify-end gap-3">
              <button
                className="bg-[#E22026] cursor-pointer md:block hidden hover:bg-[#74BF44] text-white font-medium px-5 py-2 rounded-md shadow-md transition-all"
                onClick={openModal}
                type="button"
              >
                Enquire Now
              </button>

              <button
                className="text-[#241d1f] md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Spacer */}
      <div className={`transition-all duration-300 ease-in-out ${isScrolled ? 'h-[75px]' : 'h-[80px]'
        }`} />

      <ContactModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}