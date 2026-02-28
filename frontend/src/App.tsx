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

function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <Navbar />
      <main style={{ paddingTop: "72px" }}>
        <Dashboard />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <CircleList />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <VaultPanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <LoanPanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <RoscaPanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <TaskBoard />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <TreasuryPanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <GovernancePanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <ArbitrationPanel />
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 1.5rem" }} />
        <SCreditPanel />
        <footer style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
          REXONOBIT — Bitcoin-Native Micro-Economy Protocol on Stacks · Open Source
        </footer>
      </main>
    </div>
  );
}

export default App
