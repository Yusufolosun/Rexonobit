// frontend/src/components/Navbar.tsx

import React from "react";
import { useWallet } from "../context/WalletContext";

const LINKS = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Circles",   href: "#circles" },
  { label: "Vault",     href: "#vault" },
  { label: "Loans",     href: "#loans" },
  { label: "ROSCA",     href: "#rosca" },
  { label: "Tasks",     href: "#tasks" },
  { label: "Treasury",  href: "#treasury" },
  { label: "Governance",href: "#governance" },
];

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const { address, connected, connect, disconnect } = useWallet();

  return (
    <nav role="navigation" aria-label="Main navigation" style={{
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0 1.25rem",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "3.5rem",
        gap: "1rem",
      }}>
        {/* Logo */}
        <span style={{
          fontWeight: 800,
          fontSize: "1.1rem",
          letterSpacing: "-0.04em",
          color: "var(--color-primary)",
          whiteSpace: "nowrap",
        }}>
          ◈ REXONOBIT
        </span>

        {/* Links */}
        <div style={{ display: "flex", gap: "0.1rem", flexWrap: "wrap" }}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                padding: "0.3rem 0.6rem",
                borderRadius: "0.4rem",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.color = "var(--color-text-muted)";
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Wallet button */}
        {connected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="text-mono" style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              padding: "0.3rem 0.65rem",
              fontSize: "0.75rem",
            }}>
              {address ? truncate(address) : "connected"}
            </span>
            <button className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }} onClick={disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={connect} style={{ whiteSpace: "nowrap" }}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
