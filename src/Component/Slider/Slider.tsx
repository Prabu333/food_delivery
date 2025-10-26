import React, { useEffect, useRef, useState } from "react";

const images = [
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg",
  "https://images.pexels.com/photos/3028127/pexels-photo-3028127.jpeg",
  "https://images.pexels.com/photos/8215110/pexels-photo-8215110.jpeg",
  "https://images.pexels.com/photos/863006/pexels-photo-863006.jpeg",
  "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg",
  "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg",
  "https://images.pexels.com/photos/1893555/pexels-photo-1893555.jpeg",
  "https://images.pexels.com/photos/5718019/pexels-photo-5718019.jpeg",
  "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg",
];

const Slider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const resetInterval = () => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
  };

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    resetInterval();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, index) => (
          <div key={index} className="flex-shrink-0 w-full">
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              className="w-full h-64 md:h-[500px] object-cover"
            />
          </div>
        ))}
      </div>

      {/* Header with Modern Font */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-white text-3xl md:text-5xl font-modern font-bold drop-shadow-lg tracking-wide">
          TJSJ Food Delivery
        </h1>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`w-3 h-3 rounded-full cursor-pointer ${
              idx === currentIndex ? "bg-green-600" : "bg-gray-300"
            }`}
            onClick={() => handleDotClick(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
