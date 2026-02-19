import React, { useEffect, useRef, useState } from "react";

interface MTRXLogoProps {
  size?: "small" | "medium" | "large";
  withText?: boolean;
  withGlow?: boolean;
  onClick?: () => void;
  variant?: "light" | "dark";
}

export default function MTRXLogo({
  size = "medium",
  withText = false,
  withGlow = true,
  onClick,
  variant = "light",
}: MTRXLogoProps) {
  const sizeMap = {
    small: { svg: 48, text: 14 },
    medium: { svg: 120, text: 18 },
    large: { svg: 280, text: 32 },
  };

  const dimensions = sizeMap[size];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    // Process the logo image to remove black background
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      // Get image data and remove black pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Replace black/dark pixels with transparency
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If pixel is very dark (close to black), make it transparent
        if (r < 40 && g < 40 && b < 40) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        } else if (variant === "dark") {
          // For dark variant, invert colors (white becomes black)
          data[i] = 255 - r;
          data[i + 1] = 255 - g;
          data[i + 2] = 255 - b;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setLogoReady(true);
    };
    img.onerror = () => {
      console.error("Failed to load logo image");
      setLogoReady(true); // Still mark as ready to show something
    };
    img.src = "/mtrx-logo.jpg";
  }, [variant]);

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: size === "small" ? "8px" : "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.3s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        }
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>

      <canvas
        ref={canvasRef}
        width={dimensions.svg}
        height={dimensions.svg}
        style={{
          width: dimensions.svg,
          height: dimensions.svg,
          filter: withGlow
            ? variant === "dark"
              ? "drop-shadow(0 0 6px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 12px rgba(0, 0, 0, 0.15))"
              : "drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.2))"
            : "none",
          animation: logoReady ? "slideIn 0.8s ease-out" : "none",
          display: logoReady ? "block" : "none",
        }}
      />

      {/* Text - only show if withText is true */}
      {withText && (
        <div
          style={{
            fontSize: `${dimensions.text}px`,
            fontWeight: "700",
            color: variant === "dark" ? "#000000" : "white",
            letterSpacing: "3px",
            textTransform: "uppercase",
            animation:
              logoReady && withGlow
                ? "slideIn 0.8s ease-out 0.2s both"
                : "none",
            textShadow: withGlow
              ? variant === "dark"
                ? "0 0 3px rgba(0, 0, 0, 0.3), 0 0 6px rgba(0, 0, 0, 0.15)"
                : "0 0 3px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.1)"
              : "none",
          }}
        >
          MTRX INC
        </div>
      )}
    </div>
  );
}
