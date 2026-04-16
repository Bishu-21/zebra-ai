"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";

interface ScratchCardProps {
  frontContent: ReactNode;
  backContent: ReactNode;
  onRevealComplete?: () => void;
  className?: string;
}

export function ScratchCard({
  frontContent,
  backContent,
  onRevealComplete,
  className = "",
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDrawing = useRef(false);

  // Optimized noise background via CSS
  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paintCanvas = (width: number, height: number) => {
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      // Fill with blue and simple pattern - NO more pixel loops
      ctx.fillStyle = "#3B82F6"; 
      ctx.fillRect(0, 0, width, height);

      // Add a simple subtle overlay instead of heavy noise loop
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = "black";
      for(let i=0; i<100; i++) {
        ctx.fillRect(Math.random()*width, Math.random()*height, 2, 2);
      }
      ctx.globalAlpha = 1.0;

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 120; // Increased for faster reveal
      ctx.globalCompositeOperation = "destination-out";
      
      setIsLoaded(true);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          paintCanvas(width, height);
        }
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const lastCheckTime = useRef(0);
  const rafId = useRef<number | null>(null);

  const checkRevealPercent = () => {
    const now = Date.now();
    if (now - lastCheckTime.current < 250) return; // Throttled check
    lastCheckTime.current = now;

    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    try {
      // Much more lightweight check - only sample 1/256th of the pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentCount = 0;

      for (let i = 3; i < pixels.length; i += 256) {
        if (pixels[i] === 0) transparentCount++;
      }

      if ((transparentCount / (pixels.length / 256)) > 0.35) {
        setIsRevealed(true);
        if (onRevealComplete) onRevealComplete();
      }
    } catch {
      // Ignore errors for off-screen checks
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    setIsScratching(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    
    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      const { x, y } = getCoordinates(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      checkRevealPercent();
    });
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[320px] max-w-xl mx-auto overflow-hidden rounded-[16px] shadow-[0px_10px_40px_rgba(0,0,0,0.06)] bg-[#3B82F6] ${className}`}
      style={{ backgroundImage: isRevealed ? 'none' : noiseBg }}
    >
      {/* Revealed Content (Bottom Layer) */}
      <div className="absolute inset-0 p-8 bg-white text-[#0A0A0A] flex flex-col justify-between">
        {backContent}
      </div>

      {/* Surface Canvas (Interaction Layer) */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`absolute inset-0 z-10 w-full h-full cursor-pointer transition-opacity duration-700 ease-out ${
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
        } ${!isLoaded ? "invisible" : "visible"}`}
      />

      {/* Helper Text / Initial State (Top Layer) - No interaction to block */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none p-10 text-white flex flex-col justify-between transition-opacity duration-300 ${
          isScratching || isRevealed || !isLoaded ? "opacity-0" : "opacity-100"
        }`}
      >
        {frontContent}
      </div>
    </div>
  );
}
