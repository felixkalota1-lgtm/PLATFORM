import React, { useState } from "react";
import MTRXLogo from "./MTRXLogo";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isHoveringButton, setIsHoveringButton] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle, rgba(192, 192, 192, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "-100px",
          right: "-100px",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background:
            "radial-gradient(circle, rgba(192, 192, 192, 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          bottom: "-50px",
          left: "-50px",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          zIndex: 10,
          animation: "fadeInDown 0.8s ease-out",
        }}
      >
        {/* Logo - Large and Centered */}
        <div
          style={{
            marginBottom: "60px",
            animation: "slideInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <MTRXLogo size="large" withGlow={true} />
        </div>

        {/* Company Name */}
        <h1
          style={{
            fontSize: "56px",
            fontWeight: "300",
            color: "white",
            margin: "0 0 20px 0",
            letterSpacing: "8px",
            textTransform: "uppercase",
            animation: "fadeInDown 0.8s ease-out 0.2s both",
          }}
        >
          WELCOME TO
        </h1>

        <h2
          style={{
            fontSize: "72px",
            fontWeight: "700",
            background:
              "linear-gradient(135deg, #c0c0c0 0%, #ffffff 50%, #c0c0c0 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 60px 0",
            letterSpacing: "4px",
            textTransform: "uppercase",
            animation: "fadeInDown 0.8s ease-out 0.4s both",
          }}
        >
          Matrix Hub
        </h2>

        {/* Subtitle/Description */}
        <p
          style={{
            fontSize: "18px",
            color: "rgba(192, 192, 192, 0.8)",
            margin: "0 0 80px 0",
            maxWidth: "600px",
            lineHeight: "1.6",
            animation: "fadeInUp 0.8s ease-out 0.6s both",
            fontWeight: "300",
          }}
        >
          Your comprehensive platform for sales, procurement, and vendor
          management. Streamline your business operations with Matrix Hub.
        </p>

        {/* Get Started Button */}
        <button
          onClick={onGetStarted}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
          style={{
            padding: "16px 48px",
            fontSize: "16px",
            fontWeight: "600",
            letterSpacing: "2px",
            textTransform: "uppercase",
            background: isHoveringButton
              ? "rgba(192, 192, 192, 0.2)"
              : "rgba(192, 192, 192, 0.1)",
            color: "white",
            border: "2px solid rgba(192, 192, 192, 0.6)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: isHoveringButton
              ? "0 0 20px rgba(192, 192, 192, 0.4), inset 0 0 20px rgba(192, 192, 192, 0.1)"
              : "0 0 10px rgba(192, 192, 192, 0.2)",
            animation: "fadeInUp 0.8s ease-out 0.8s both",
          }}
        >
          Get Started
        </button>
      </div>

      {/* Trademark - Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          fontSize: "14px",
          color: "rgba(192, 192, 192, 0.5)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          animation: "fadeIn 1.2s ease-out 1s both",
        }}
      >
        © MTRX INC
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-50px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 30px);
          }
        }
      `}</style>
    </div>
  );
}
