import { useState, useRef } from 'react';

export default function BeforeAfterSlider({ before, after, title }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // If no 'before' image is uploaded or it matches the 'after' image, just show a static 'after' image.
  if (!before || before === after) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
        <img 
          src={after} 
          alt={title} 
          className="h-full w-full object-cover" 
          loading="lazy"
        />
        <span className="absolute right-4 top-4 rounded bg-leaf-700/85 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm z-10">
          Project Photo
        </span>
      </div>
    );
  }

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;
    handleMove(event.clientX);
  };

  const handleTouchMove = (event) => {
    if (!isDragging) return;
    if (event.touches[0]) {
      handleMove(event.touches[0].clientX);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden select-none cursor-ew-resize rounded-t-2xl bg-leaf-50 dark:bg-leaf-950"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => {
        e.preventDefault();
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        if (e.touches[0]) {
          handleMove(e.touches[0].clientX);
        }
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Before Image (underneath) */}
      <img 
        src={before} 
        alt={`${title} Before`} 
        className="absolute inset-0 h-full w-full object-cover pointer-events-none" 
        loading="lazy"
      />
      <span className="absolute left-4 top-4 rounded bg-black/60 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm z-10 pointer-events-none">
        Before
      </span>

      {/* After Image (clipped top layer) */}
      <div 
        className="absolute inset-y-0 left-0 right-0 overflow-hidden pointer-events-none" 
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img 
          src={after} 
          alt={`${title} After`} 
          className="absolute inset-0 h-full w-full object-cover pointer-events-none" 
          loading="lazy"
        />
      </div>
      <span className="absolute right-4 top-4 rounded bg-leaf-700/85 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm z-10 pointer-events-none">
        After
      </span>

      {/* Slider Divider Bar */}
      <div 
        className="absolute inset-y-0 w-1 bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-leaf-900 border border-leaf-700/20 shadow-lg flex items-center justify-center pointer-events-none select-none z-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left-right" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5zm14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
