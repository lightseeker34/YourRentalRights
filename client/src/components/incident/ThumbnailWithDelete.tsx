import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface ThumbnailWithDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  onPreview: () => void;
  className?: string;
}

export function ThumbnailWithDelete({ children, onDelete, onPreview, className = "" }: ThumbnailWithDeleteProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!showDelete) return;
    const dismiss = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDelete(false);
      }
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('touchstart', dismiss);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('touchstart', dismiss);
    };
  }, [showDelete]);

  const handleTouchStart = () => {
    longPressTriggered.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setShowDelete(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (showDelete) {
      setShowDelete(false);
      return;
    }
    onPreview();
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative group ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"
        title="Delete"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
      {showDelete && (
        <div className="absolute inset-0 bg-transparent flex items-center justify-center z-10 rounded md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowDelete(false);
            }}
            className="bg-white text-red-600 rounded-full p-1.5 shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
