"use client";

import { useState, useEffect } from "react";
import Head from "next/head";

import Hero from "@/components/Hero";
import Partners from "@/components/Partners";
import TreatmentServices from "@/components/TreatmentServices";
import Testimonials from "@/components/Testimonials";
import MediaCoverage from "@/components/mediaCovrage";
import BlogSection from "@/components/BlogSection";
import PaitentSupport from "@/components/paitentSupport";
import PartnerSection from "@/components/PartnerSection";
import ExtentCare from "@/components/extentCare";
import ContactModal from "@/components/ContactModal";
import Activities from "@/components/Activities";
import CtaSection from "@/components/CtaSection";
import DidYouKnowSection from "@/components/DidYouKnow";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleModalOpen = () => setIsModalOpen(true);
    const modalButtons = document.querySelectorAll(".modal-open-btn");

    modalButtons.forEach((button) => {
      button.addEventListener("click", handleModalOpen);
    });

    return () => {
      modalButtons.forEach((button) => {
        button.removeEventListener("click", handleModalOpen);
      });
    };
  }, []);

  return (
    <>
     

      {/* ✅ Page Content */}
      <div className="bg-white min-h-screen">
        <main>
          <Hero />
          <Partners />
          <DidYouKnowSection />
          <BlogSection />
          <TreatmentServices />
          <Testimonials />
          <PaitentSupport />
          <Activities />
          <ExtentCare />
          <MediaCoverage />
          <PartnerSection />
          <CtaSection />
        </main>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  );
}