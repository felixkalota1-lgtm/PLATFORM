import React, { Dispatch, SetStateAction } from "react";

interface DashboardMetrics {
  outgoingQuotations: number;
  outgoingInquiries: number;
  invoices: number;
  totalOrders: number;
  totalProducts: number;
  vendorConnections: number;
}

interface HomeDashboardProps {
  metrics: DashboardMetrics;
  userName?: string;
  userCompany?: string;
  onNavigate?: (section: string) => void;
  setActiveSubmenu?: Dispatch<
    SetStateAction<
      "dashboard" | "marketplace" | "warehouse" | "allDocuments" | "inbox"
    >
  >;
  setActiveWarehouseTab?: Dispatch<
    SetStateAction<
      | "products"
      | "home"
      | "quotations"
      | "inquiries"
      | "orders"
      | "invoices"
      | "vendors"
      | "settings"
    >
  >;
}

export default function HomeDashboard({
  metrics,
  userName = "User",
  userCompany = "Company",
  onNavigate,
  setActiveSubmenu,
  setActiveWarehouseTab,
}: HomeDashboardProps) {
  const cards = [
    {
      id: "quotations",
      label: "Outgoing Quotations",
      value: metrics.outgoingQuotations,
      icon: "📊",
      color: "#5b7c99",
      bgColor: "rgba(91, 124, 153, 0.1)",
    },
    {
      id: "inquiries",
      label: "Outgoing Inquiries",
      value: metrics.outgoingInquiries,
      icon: "💬",
      color: "#0284c7",
      bgColor: "rgba(2, 132, 199, 0.1)",
    },
    {
      id: "invoices",
      label: "Invoices",
      value: metrics.invoices,
      icon: "📄",
      color: "#059669",
      bgColor: "rgba(5, 150, 105, 0.1)",
    },
    {
      id: "orders",
      label: "Total Orders",
      value: metrics.totalOrders,
      icon: "📦",
      color: "#7c3aed",
      bgColor: "rgba(124, 58, 237, 0.1)",
    },
    {
      id: "inventory",
      label: "Products in Inventory",
      value: metrics.totalProducts,
      icon: "📦",
      color: "#ea580c",
      bgColor: "rgba(234, 88, 12, 0.1)",
    },
    {
      id: "vendors",
      label: "Vendor Connections",
      value: metrics.vendorConnections,
      icon: "🤝",
      color: "#0891b2",
      bgColor: "rgba(8, 145, 178, 0.1)",
    },
  ];

  return (
    <div
      style={{
        padding: "32px",
        background: "#ffffff",
        maxWidth: "1400px",
        margin: "0 auto",
        borderRadius: "12px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "40px", animation: "fadeIn 0.6s ease-out" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "32px",
            fontWeight: "700",
            color: "#1a365d",
          }}
        >
          Welcome, {userName}
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          {userCompany} • Dashboard Overview
        </p>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => {
              if (setActiveSubmenu && setActiveWarehouseTab) {
                setActiveSubmenu("warehouse");
                // Map card IDs to proper tab names
                const tabMapping: Record<
                  string,
                  | "products"
                  | "home"
                  | "quotations"
                  | "inquiries"
                  | "orders"
                  | "invoices"
                  | "vendors"
                  | "settings"
                > = {
                  quotations: "quotations",
                  inquiries: "inquiries",
                  invoices: "invoices",
                  orders: "orders",
                  inventory: "products",
                };
                const tabName = tabMapping[card.id] || "products";
                setActiveWarehouseTab(tabName);
              }
              onNavigate?.(card.id);
            }}
            style={{
              background: card.bgColor,
              border: `2px solid ${card.color}`,
              borderRadius: "12px",
              padding: "24px",
              cursor: onNavigate ? "pointer" : "default",
              transition: "all 0.3s ease",
              animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              if (onNavigate) {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  `0 8px 24px ${card.color}40`;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            {/* Icon and Label */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "28px" }}>{card.icon}</div>
              <span
                style={{
                  fontSize: "12px",
                  color: card.color,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {card.id}
              </span>
            </div>

            {/* Label */}
            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                color: "#64748b",
                fontWeight: "500",
              }}
            >
              {card.label}
            </p>

            {/* Value */}
            <div
              style={{
                fontSize: "36px",
                fontWeight: "700",
                color: card.color,
              }}
            >
              {card.value}
            </div>

            {/* Arrow (only if clickable) */}
            {onNavigate && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: card.color,
                  opacity: 0.6,
                  transition: "all 0.3s ease",
                }}
              >
                View Details →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          padding: "24px",
          animation: "fadeInUp 0.6s ease-out 0.6s both",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "16px",
            fontWeight: "700",
            color: "#1a365d",
          }}
        >
          Quick Actions
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            {
              label: "Create Quotation",
              action: "quotations",
              color: "#5b7c99",
            },
            { label: "New Inquiry", action: "inquiries", color: "#0284c7" },
            {
              label: "Browse Marketplace",
              action: "marketplace",
              color: "#059669",
            },
            { label: "Manage Vendors", action: "vendors", color: "#0891b2" },
          ].map((action) => (
            <button
              key={action.action}
              onClick={() => onNavigate?.(action.action)}
              style={{
                padding: "12px 16px",
                background: action.color,
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
