'use client';

import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface LeftSlide {
  id: number;
  image: string;
}

const LEFT_SLIDES: LeftSlide[] = [
  { id: 1, image: '/lb.jpeg' },
  { id: 2, image: '/doctor1.png' },
];

const LeftSideCarousel: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 2000, // Slower motion - 2 seconds for slide transition
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // 5 seconds between slides
    arrows: false,
    pauseOnHover: true,
    customPaging: (_i: number) => (
      <div className="h-2.5 w-2.5 rounded-full bg-slate-400/70 transition hover:bg-slate-500" />
    ),
  };

  if (!isMounted) {
    return (
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-lg" />
    );
  }

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg bg-white">
      <Slider {...settings}>
        {LEFT_SLIDES.map((slide) => (
          <div key={slide.id} className="w-full h-full">
            <img
              src={slide.image}
              alt="Hero carousel image"
              className="block w-full h-full object-cover object-center"
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

export default LeftSideCarousel;
