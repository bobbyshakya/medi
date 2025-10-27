// components/HeroSlider.js
'use client';

import React from 'react';
import Slider from 'react-slick';
import Banner1 from '@/components/Hero';
import Banner2 from '@/components/eyeBanner';
import Banner3 from '@/components/PacificBanner';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const HeroSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    fade: true,
    arrows: true,
    adaptiveHeight: true, // ✅ dynamic height per slide
    cssEase: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    waitForAnimate: true,
    swipe: true,
    touchThreshold: 10,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false, // ✅ hide arrows on mobile
          dots: false, // ✅ hide dots on mobile
          speed: 800,
          adaptiveHeight: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          arrows: false,
          dots: false,
          speed: 600,
          adaptiveHeight: true,
        },
      },
    ],
  };

  const NextArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={`${className} custom-next-arrow`}
        style={{ ...style }}
        onClick={onClick}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E22026] backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:scale-105 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={`${className} custom-prev-arrow`}
        style={{ ...style }}
        onClick={onClick}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E22026] backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:scale-105 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  };

  settings.nextArrow = <NextArrow />;
  settings.prevArrow = <PrevArrow />;

  return (
    <div className="hero-slider relative w-full mx-auto overflow-hidden">
      <Slider {...settings}>
        <div key="banner1">
          <Banner1 />
        </div>
        <div key="banner2">
          <a href="/pacific-patient">
            <Banner2 />
          </a>
        </div>
        <div key="banner3">
          <a href="/fiji-eye-test">
            <Banner3 />
          </a>
        </div>
      </Slider>

      <style jsx global>{`
        /* Hide default slick arrows since we're using custom ones */
        .hero-slider .slick-prev:before,
        .hero-slider .slick-next:before {
          display: none;
        }

        /* Arrow position */
        .hero-slider .slick-prev {
          left: 2rem;
          z-index: 10;
        }

        .hero-slider .slick-next {
          right: 2rem;
          z-index: 10;
        }

        /* Dot customization */
        .hero-slider .slick-dots {
          bottom: 2rem;
          z-index: 10;
        }

        .hero-slider .slick-dots li {
          margin: 0 0.375rem;
          width: 0.75rem;
          height: 0.75rem;
        }

        .hero-slider .slick-dots li button:before {
          content: '';
          width: 0.75rem;
          height: 0.75rem;
          background: #ccc;
          border-radius: 50%;
          opacity: 1;
          transition: all 0.3s ease;
        }

        .hero-slider .slick-dots li.slick-active button:before {
          background: #74BF44;
          opacity: 1;
          transform: scale(1.2);
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hero-slider .slick-prev,
          .hero-slider .slick-next {
            display: none !important; /* ✅ hide arrows on mobile */
          }

          .hero-slider .slick-dots {
            display: none !important; /* ✅ hide dots on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
