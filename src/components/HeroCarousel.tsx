'use client';

import React, { useRef } from 'react';
import Slider from 'react-slick';
import Link from 'next/link';
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
  gradient: string;
  stats: string[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Complete Health Solutions',
    subtitle: "CONNECT WITH YOUR WELLNESS",
    description: 'Comprehensive healthcare services at your fingertips. Medicines, Doctor Consultations, and more.',
    image: '/Connect.png',
    primaryCTA: { text: 'Explore Services', href: '/medicines' },
    secondaryCTA: { text: 'Learn More', href: '/shop' },
    gradient: 'from-emerald-600/30 via-emerald-500/25 to-teal-600/30',
    stats: ['✓ 2 Crore+ Customers', '✓ 24/7 Support', '✓ Quick Delivery'],
  },
  {
    id: 2,
    title: 'Complete Health Checkup',
    subtitle: 'COMPREHENSIVE WELLNESS ASSESSMENT',
    description: 'Full body health checkups with lab tests. Get detailed health reports and expert guidance.',
    image: '/Health-Checkup.png',
    primaryCTA: { text: 'Book Test', href: '/lab-tests' },
    secondaryCTA: { text: 'View Packages', href: '/lab-tests' },
    gradient: 'from-blue-600/30 via-blue-500/25 to-cyan-600/30',
    stats: ['✓ 500+ Tests', '✓ Home Collection', '✓ Quick Results'],
  },
  {
    id: 3,
    title: 'Expert Finger Diagnosis',
    subtitle: 'ADVANCED HEALTH MONITORING',
    description: 'Innovative pulse analysis and health assessment. Get personalized health recommendations.',
    image: '/Finger.png',
    primaryCTA: { text: 'Get Assessment', href: '/doctor-consultation' },
    secondaryCTA: { text: 'Consult Doctor', href: '/doctor-consultation' },
    gradient: 'from-purple-600/30 via-purple-500/25 to-pink-600/30',
    stats: ['✓ AI-Powered', '✓ Accurate Results', '✓ Instant Feedback'],
  },
  {
    id: 4,
    title: 'Authentic Ayurvedic Products',
    subtitle: 'ANCIENT WISDOM, MODERN WELLNESS',
    description: '100% natural & certified Ayurvedic remedies. Holistic solutions for your health.',
    image: '/Ayurvedic.png',
    primaryCTA: { text: 'Shop Ayurveda', href: '/ayurveda' },
    secondaryCTA: { text: 'Consult Vaidya', href: '/doctor-consultation' },
    gradient: 'from-amber-600/30 via-amber-500/25 to-yellow-600/30',
    stats: ['✓ 100% Natural', '✓ Certified', '✓ Best Prices'],
  },
  {
    id: 5,
    title: 'Homeopathic Healing',
    subtitle: 'NATURAL & SAFE TREATMENT',
    description: 'FDA-approved homeopathic remedies. Gentle, safe, and effective treatments for your family.',
    image: '/Homiopethic.png',
    primaryCTA: { text: 'Explore Range', href: '/homeopathy' },
    secondaryCTA: { text: 'Expert Guidance', href: '/doctor-consultation' },
    gradient: 'from-rose-600/30 via-rose-500/25 to-pink-600/30',
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
          <div key={slide.id} className="!flex">
            {/* Full-Screen Background Image with Overlay */}
            <div className="relative w-full min-h-[500px] md:min-h-[450px] flex items-center overflow-hidden">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover object-center"
                priority
                unoptimized={true}
              />

              {/* Light Gradient Overlay for better visibility */}
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}></div>

              {/* Dark overlay only on left side for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>

              {/* Content Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full px-4 md:px-6 flex justify-center">
                  <div className="text-center">
                    {/* Badge - Hidden */}
                    <span className="hidden">
                      {slide.subtitle}
                    </span>

                    {/* Title - Hidden */}
                    <h1 className="hidden">
                      {slide.title}
                    </h1>

                    {/* Description - Hidden */}
                    <p className="hidden">
                      {slide.description}
                    </p>

                    {/* CTA Buttons - Hidden */}
                    <div className="hidden flex flex-col sm:flex-row gap-4 mb-8 justify-center">
                      <Link
                        href={slide.primaryCTA.href}
                        className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-center"
                      >
                        {slide.primaryCTA.text}
                      </Link>
                      <Link
                        href={slide.secondaryCTA.href}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/50 text-center"
                      >
                        {slide.secondaryCTA.text}
                      </Link>
                    </div>

                    {/* Stats - Hidden */}
                    <div className="hidden">
                      {slide.stats.map((stat, idx) => (
                        <span key={idx}>{stat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
