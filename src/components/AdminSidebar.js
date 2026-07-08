"use client";

import Link from "next/link";

export default function AdminSidebar({ active }) {
  return (
    <aside style={sidebarStyle}>
      <Link href="/" style={sidebarHeaderLinkStyle}>
        <div style={sidebarHeaderStyle}>
          <span style={sidebarTitleStyle}>Ginija Portal</span>
          <span style={adminBadgeStyle}>Management System</span>
        </div>
      </Link>
      <nav style={sidebarNavStyle}>
        <Link 
          href="/admin/dashboard" 
          style={active === "dashboard" ? activeNavLinkStyle : navLinkStyle}
        >
          Dashboard Overview
        </Link>
        <Link 
          href="/admin/products" 
          style={active === "products" ? activeNavLinkStyle : navLinkStyle}
        >
          Products Manager
        </Link>
        <Link 
          href="/admin/flash-sale" 
          style={active === "flash-sale" ? activeNavLinkStyle : navLinkStyle}
        >
          Flash Sale Manager
        </Link>
        <Link 
          href="/admin/orders" 
          style={active === "orders" ? activeNavLinkStyle : navLinkStyle}
        >
          Orders Pipeline
        </Link>
        <Link 
          href="/admin/coupons" 
          style={active === "coupons" ? activeNavLinkStyle : navLinkStyle}
        >
          Coupons Manager
        </Link>
      </nav>
      <div style={sidebarFooterStyle}>
        <span style={sidebarFooterTextStyle}>
          Ginija Portal v1.0
        </span>
      </div>
    </aside>
  );
}

const sidebarStyle = {
  backgroundColor: "#F6DDE2",
  color: "#000000",
  padding: "2rem 1.5rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  borderRight: "1px solid rgba(74, 52, 57, 0.08)",
  width: "240px",
  minWidth: "240px",
  boxSizing: "border-box",
};

const sidebarHeaderLinkStyle = {
  textDecoration: "none",
  display: "block",
};

const sidebarHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
  marginBottom: "3rem",
};

const sidebarTitleStyle = {
  fontFamily: "var(--font-serif)",
  fontSize: "1.3rem",
  letterSpacing: "0.12em",
  fontWeight: "600",
  color: "#000000",
};

const adminBadgeStyle = {
  fontSize: "0.62rem",
  textTransform: "uppercase",
  color: "#000000",
  letterSpacing: "0.1em",
  fontWeight: "600",
};

const sidebarNavStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
  flex: 1,
};

const navLinkStyle = {
  color: "#000000",
  fontSize: "0.85rem",
  fontWeight: "600",
  padding: "0.6rem 0.8rem",
  borderRadius: "4px",
  transition: "all 0.2s ease",
  textDecoration: "none",
  display: "block",
};

const activeNavLinkStyle = {
  ...navLinkStyle,
  color: "#000000",
  backgroundColor: "#D98E9B",
};

const sidebarFooterStyle = {
  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
  paddingTop: "1.2rem",
};

const sidebarFooterTextStyle = {
  fontSize: "0.75rem",
  color: "rgba(0, 0, 0, 0.4)",
  textAlign: "center",
  display: "block",
  fontWeight: "500",
};
