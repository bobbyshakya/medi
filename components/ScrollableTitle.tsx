import React, { useRef, useEffect, useState } from "react"

const ScrollableTitle = ({ text, className, isHovered }: { text: string; className?: string; isHovered: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [animationDuration, setAnimationDuration] = useState('0s');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const rAF = window.requestAnimationFrame(() => {
        if (containerRef.current && textRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const textWidth = textRef.current.scrollWidth;

          if (textWidth > containerWidth) {
            setIsOverflowing(true);
            const duration = textWidth / 50;
            setAnimationDuration(`${Math.max(duration, 5)}s`);
          } else {
            setIsOverflowing(false);
            setAnimationDuration('0s');
          }
        }
      });
      return () => window.cancelAnimationFrame(rAF);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  const isMarqueeActive = isOverflowing && (isHovered || isMobile);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        className={`whitespace-nowrap inline-block ${!isMarqueeActive ? 'truncate w-full' : ''}`}
        style={{
          animation: isMarqueeActive ? `marquee ${animationDuration} linear infinite` : 'none',
          transform: 'translateX(0)',
        }}
      >
        <span ref={textRef} className="inline-block pr-8">
          {text}
        </span>

        {isMarqueeActive && (
          <span className="inline-block pr-8">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScrollableTitle