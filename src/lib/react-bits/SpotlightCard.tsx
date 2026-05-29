import React, { useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
  /** 固定光斑位置（不跟随鼠标）。用于栅格化场景（html-to-image），让 PNG 含光斑。 */
  staticPosition?: Position;
  /** 固定光斑透明度（仅在 staticPosition 设置时生效）。 */
  staticOpacity?: number;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  staticPosition,
  staticOpacity = 0.55,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const isStatic = !!staticPosition;
  const effectivePosition = staticPosition ?? position;
  const effectiveOpacity = isStatic ? staticOpacity : opacity;

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (isStatic || !divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    if (isStatic) return;
    setIsFocused(true);
    setOpacity(0.6);
  };
  const handleBlur = () => {
    if (isStatic) return;
    setIsFocused(false);
    setOpacity(0);
  };
  const handleMouseEnter = () => {
    if (isStatic) return;
    setOpacity(0.6);
  };
  const handleMouseLeave = () => {
    if (isStatic) return;
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity: effectiveOpacity,
          background: `radial-gradient(circle at ${effectivePosition.x}px ${effectivePosition.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
