'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CardSwapProps {
  images: Array<{
    src: string;
    alt: string;
    title: string;
  }>;
}

export default function CardSwap({ images }: CardSwapProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative h-80 rounded-2xl overflow-hidden">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 transform ${
              index === currentIndex
                ? 'opacity-100 scale-100 z-10'
                : index === (currentIndex - 1 + images.length) % images.length
                ? 'opacity-60 scale-95 -translate-x-4 z-5'
                : index === (currentIndex + 1) % images.length
                ? 'opacity-60 scale-95 translate-x-4 z-5'
                : 'opacity-0 scale-90'
            }`}
            style={{
              transitionDelay: index === currentIndex ? '0ms' : '100ms',
            }}
          >
            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
              <div className="p-4 h-full flex flex-col">
                <div className="flex-1 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {image.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 指示器 */}
      <div className="flex justify-center mt-6 space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 