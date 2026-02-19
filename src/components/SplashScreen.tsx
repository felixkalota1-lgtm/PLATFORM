import React, { useEffect, useState } from "react";
import MTRXLogo from "./MTRXLogo";

interface SplashScreenProps {
  isVisible: boolean;
  loadingProgress?: number;
}

export default function SplashScreen({
  isVisible,
  loadingProgress = 0,
}: SplashScreenProps) {
  const [displayText, setDisplayText] = useState("Initializing Matrix Hub");
  const textVariants = [
    "Initializing Matrix Hub",
    "Loading your inventory",
    "Connecting to vendors",
    "Preparing dashboard",
  ];

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDisplayText((prev) => {
        const currentIndex = textVariants.indexOf(prev);
        return textVariants[(currentIndex + 1) % textVariants.length];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Main Logo */}
      <div
        style={{
          marginBottom: "60px",
          animation: "softGlow 2s ease-in-out infinite",
        }}
      >
        <MTRXLogo size="large" withGlow={true} />
      </div>

      {/* Loading Text */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <p
          style={{
            fontSize: "18px",
            color: "#ffffff",
            margin: "0 0 16px 0",
            letterSpacing: "2px",
            animation: "fadeInOut 1s ease-in-out infinite",
            fontWeight: "300",
          }}
        >
          {displayText}
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: "200px",
            height: "4px",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "100px",
            overflow: "hidden",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              height: "100%",
              background:
                "linear-gradient(90deg, #c0c0c0 0%, #ffffff 50%, #c0c0c0 100%)",
              width: `${Math.min(loadingProgress, 100)}%`,
              transition: "width 0.3s ease",
              borderRadius: "100px",
              boxShadow: "0 0 10px rgba(192, 192, 192, 0.8)",
            }}
          />
        </div>
      </div>

      {/* Trademark at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          fontSize: "12px",
          color: "rgba(192, 192, 192, 0.6)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        © 2026 MTRX INC. All Rights Reserved.
      </div>

      <style>{`
        @keyframes softGlow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
