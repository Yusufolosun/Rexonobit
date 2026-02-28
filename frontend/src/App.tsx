// App.tsx — REXONOBIT protocol UI composition
// Single-page section layout — all panels rendered, Navbar anchors scroll to sections

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import CircleList from "./components/CircleList";
import VaultPanel from "./components/VaultPanel";
import LoanPanel from "./components/LoanPanel";
import RoscaPanel from "./components/RoscaPanel";
import TaskBoard from "./components/TaskBoard";
import TreasuryPanel from "./components/TreasuryPanel";
import GovernancePanel from "./components/GovernancePanel";
import ArbitrationPanel from "./components/ArbitrationPanel";
import SCreditPanel from "./components/SCreditPanel";
import MemberProfile from "./components/MemberProfile";
import BadgeGallery from "./components/BadgeGallery";
import TxHistory from "./components/TxHistory";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtocolStats } from "./components/ProtocolStats";

const divider = <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />;

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <Navbar />
      <main style={{ paddingTop: "72px" }}>
        <ErrorBoundary><ProtocolStats /></ErrorBoundary>
        {divider}
        <ErrorBoundary><Dashboard /></ErrorBoundary>
        {divider}
        <ErrorBoundary><CircleList /></ErrorBoundary>
        {divider}
        <ErrorBoundary><VaultPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><LoanPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><RoscaPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><TaskBoard /></ErrorBoundary>
        {divider}
        <ErrorBoundary><TreasuryPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><GovernancePanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><ArbitrationPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><SCreditPanel /></ErrorBoundary>
        {divider}
        <ErrorBoundary><MemberProfile /></ErrorBoundary>
        {divider}
        <ErrorBoundary><BadgeGallery /></ErrorBoundary>
        {divider}
        <ErrorBoundary><TxHistory /></ErrorBoundary>
        <footer style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
          REXONOBIT — Bitcoin-Native Micro-Economy Protocol on Stacks · Open Source
        </footer>
      </main>
    </div>
  );
}

export default App
