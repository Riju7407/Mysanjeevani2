'use client';

import React, { useRef } from 'react';
import Slider from 'react-slick';
import Image from 'next/image';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA: { text: string; href: string };
  stats: string[];
}

const formatHeroImage = (url: string) => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,ar_16:9,g_auto/');
};

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Complete Health Solutions',
    subtitle: "CONNECT WITH YOUR WELLNESS",
    description: 'Comprehensive healthcare services at your fingertips. Medicines, Doctor Consultations, and more.',
    image: 'https://res.cloudinary.com/df4x2ygkw/image/upload/v1774689230/Connect_jcwckb.jpg',
    primaryCTA: { text: 'Explore Services', href: '/medicines' },
    secondaryCTA: { text: 'Learn More', href: '/shop' },
    stats: ['✓ 2 Crore+ Customers', '✓ 24/7 Support', '✓ Quick Delivery'],
  },
  {
    id: 2,
    title: 'Complete Health Checkup',
    subtitle: 'COMPREHENSIVE WELLNESS ASSESSMENT',
    description: 'Full body health checkups with lab tests. Get detailed health reports and expert guidance.',
    image: 'https://res.cloudinary.com/df4x2ygkw/image/upload/v1774689231/Health-Checkup_lbfop5.jpg',
    primaryCTA: { text: 'Book Test', href: '/lab-tests' },
    secondaryCTA: { text: 'View Packages', href: '/lab-tests' },
    stats: ['✓ 500+ Tests', '✓ Home Collection', '✓ Quick Results'],
  },
  {
    id: 3,
    title: 'Expert Finger Diagnosis',
    subtitle: 'ADVANCED HEALTH MONITORING',
    description: 'Innovative pulse analysis and health assessment. Get personalized health recommendations.',
    image: 'https://res.cloudinary.com/df4x2ygkw/image/upload/v1774689231/Finger_na8wjh.jpg',
    primaryCTA: { text: 'Get Assessment', href: '/doctor-consultation' },
    secondaryCTA: { text: 'Consult Doctor', href: '/doctor-consultation' },
    stats: ['✓ AI-Powered', '✓ Accurate Results', '✓ Instant Feedback'],
  },
  {
    id: 4,
    title: 'Authentic Ayurvedic Products',
    subtitle: 'ANCIENT WISDOM, MODERN WELLNESS',
    description: '100% natural & certified Ayurvedic remedies. Holistic solutions for your health.',
    image: 'https://res.cloudinary.com/df4x2ygkw/image/upload/v1774689231/Ayurvedic_rjqg7e.jpg',
    primaryCTA: { text: 'Shop Ayurveda', href: '/ayurveda' },
    secondaryCTA: { text: 'Consult Vaidya', href: '/doctor-consultation' },
    stats: ['✓ 100% Natural', '✓ Certified', '✓ Best Prices'],
  },
  {
    id: 5,
    title: 'Homeopathic Healing',
    subtitle: 'NATURAL & SAFE TREATMENT',
    description: 'FDA-approved homeopathic remedies. Gentle, safe, and effective treatments for your family.',
    image: 'https://res.cloudinary.com/df4x2ygkw/image/upload/v1774689232/Homiopethic_lhhovq.jpg',
    primaryCTA: { text: 'Explore Range', href: '/homeopathy' },
    secondaryCTA: { text: 'Expert Guidance', href: '/doctor-consultation' },
    stats: ['✓ FDA Approved', '✓ Expert Support', '✓ Certified Range'],
  },
];

const HeroCarousel: React.FC = () => {
  const sliderRef = useRef<Slider>(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    pauseOnHover: true,
    customPaging: (i: number) => (
      <div className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition"></div>
    ),
  };

  const goToPrev = () => sliderRef.current?.slickPrev();
  const goToNext = () => sliderRef.current?.slickNext();

  return (
    <div className="relative w-full overflow-hidden">
      <Slider ref={sliderRef} {...settings}>
        {HERO_SLIDES.map((slide) => (
          <div key={slide.id} className="flex!">
            {/* Full-Screen Background Image with Overlay */}
            <div className="relative w-full h-[52vw] min-h-[300px] max-h-[620px] md:h-[46vw] flex items-center overflow-hidden bg-slate-900">
              {/* Background Image */}
              <Image
                src={formatHeroImage(slide.image)}
                alt={slide.title}
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
                quality={95}
              />

              {/* Image-only hero per requested design */}
            </div>
          </div>
        ))}
      </Slider>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/50 hidden md:flex items-center justify-center"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/50 hidden md:flex items-center justify-center"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Custom Dots Styling */}
      <style>{`
        .slick-dots {
          position: absolute !important;
          bottom: 30px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          gap: 10px !important;
          justify-content: center !important;
          z-index: 15 !important;
          list-style: none !important;
        }

        .slick-dots li {
          display: flex !important;
        }

        .slick-dots li button {
          padding: 0 !important;
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          background: rgba(255, 255, 255, 0.5) !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .slick-dots li button:hover {
          background: rgba(255, 255, 255, 0.8) !important;
        }

        .slick-dots li.slick-active button {
          background: white !important;
          width: 32px !important;
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
