"use client";

import React, { useRef, useEffect, useState, ReactNode } from "react";
import { motion } from "framer-motion";

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
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const container = containerRef.current;
    if (!canvas || !ctx || !container) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      
      // Guard against 0 width/height during hydration or reflows
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#3B82F6"; // The primary "Action" blue
      ctx.fillRect(0, 0, width, height);

      // Add noise texture for premium feel
      const imageData = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (Math.random() > 0.8) {
          imageData.data[i] = Math.min(255, imageData.data[i] + 20);
          imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] + 20);
          imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] + 20);
        }
      }
      ctx.putImageData(imageData, 0, 0);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 120; // Increased for faster scratching
      ctx.globalCompositeOperation = "destination-out";
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
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

  const checkRevealPercent = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || isRevealed) return;
    if (canvas.width === 0 || canvas.height === 0) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;

    // Check transparency in chunks to save CPU
    for (let i = 3; i < pixels.length; i += 32) {
      if (pixels[i] === 0) transparentCount++;
    }

    const totalCalculatedPixels = pixels.length / 32;
    const percent = (transparentCount / totalCalculatedPixels) * 100;

    // Reduced threshold to 35% so it auto-completes faster!
    if (percent > 35) {
      setIsRevealed(true);
      if (onRevealComplete) onRevealComplete();
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
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    checkRevealPercent();
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[320px] max-w-xl mx-auto overflow-hidden rounded-[16px] shadow-[0px_10px_40px_rgba(0,0,0,0.06)] ${className}`}
    >
      {/* Background (The Reveal) */}
      <div className="absolute inset-0 p-8 bg-white text-[#0A0A0A] flex flex-col justify-between">
        {backContent}
      </div>

      {/* Canvas Scratch Layer */}
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
        }`}
      />

      {/* Front Content (Hidden immediately upon starting to scratch) */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none p-10 text-white flex flex-col justify-between transition-opacity duration-300 ${
          isScratching || isRevealed ? "opacity-0" : "opacity-100"
        }`}
      >
        {frontContent}
      </div>
    </div>
  );
}
