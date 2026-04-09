'use client';

import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface HeroSlide {
  id: number;
  image: string;
}

const formatHeroImage = (url: string) => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_2000,c_limit/');
};

const HERO_SLIDES: HeroSlide[] = [
  { id: 1, image: '/l1.png' },
  { id: 2, image: '/a1.png' },
  { id: 3, image: '/w1.png' },
  { id: 4, image: '/d1.png' },
  { id: 5, image: '/h1.png' },
];

const HeroCarousel: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3200,
    arrows: false,
    pauseOnHover: true,
    customPaging: (_i: number) => (
      <div className="h-2.5 w-2.5 rounded-full bg-slate-400/70 transition hover:bg-slate-500" />
    ),
  };

  if (!isMounted) {
    return <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white" />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
      <Slider {...settings}>
        {HERO_SLIDES.map((slide) => (
          <div key={slide.id} className="h-full w-full">
            <img
              src={formatHeroImage(slide.image)}
              alt="Hero image"
              className="block h-56 w-full object-cover object-center"
            />
          </div>
        ))}
      </Slider>

      {/* Custom Dots Styling */}
      <style>{`
        .slick-dots {
          position: absolute !important;
          bottom: 10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          display: flex !important;
          gap: 7px !important;
          justify-content: center !important;
          z-index: 15 !important;
          list-style: none !important;
        }

        .slick-dots li {
          display: flex !important;
        }

        .slick-dots li button {
          padding: 0 !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          background: rgba(100, 116, 139, 0.6) !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .slick-dots li button:hover {
          background: rgba(71, 85, 105, 0.8) !important;
        }

        .slick-dots li.slick-active button {
          background: #0f172a !important;
          width: 28px !important;
          border-radius: 5px !important;
        }

        .slick-slider {
          height: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
        }

        .slick-track {
          height: 100% !important;
          display: flex !important;
          overflow: hidden !important;
        }

        .slick-slide {
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          overflow: hidden !important;
          padding: 0 !important;
        }

        .slick-slide > div {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          flex: 1 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
