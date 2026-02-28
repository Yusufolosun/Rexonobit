// frontend/src/components/LoanPanel.tsx
// Circle-backed micro-lending: request loan, repay, liquidate defaulter

/**
 * LoanPanel — micro-lending interface.
 * Supports pool funding, loan requests, repayment, and liquidation of
 * defaulters. Powered by the lending-pool contract.
 */

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import { requestLoan, repayLoan, liquidateDefaulter, fundPool } from "../lib/transactions";
import { getPoolBalance, getTotalCircles } from "../lib/read";
import { useFormField } from "../hooks/useFormField";
import { validateSTX, validatePositiveInt } from "../lib/validators";
import { SkeletonCard } from "./SkeletonCard";
import { useToast } from "../context/ToastContext";
import { useWindowFocus } from "../hooks/useWindowFocus";
import { ErrorAlert } from "./ErrorAlert";
import { useContractError } from "../hooks/useContractError";

interface Pool {
  circleId: number;
  balance: number;
}

export default function LoanPanel() {
  const { address, connected } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const { success: toastSuccess } = useToast();
  const { error: contractError, clearError, setError } = useContractError();

  // Forms with validation
  const reqCircle = useFormField("", (v) => validatePositiveInt(v, "Circle ID"));
  const reqAmount = useFormField("", validateSTX);
  const repayLoanId = useFormField("", (v) => validatePositiveInt(v, "Loan ID"));
  const repayAmt = useFormField("", validateSTX);
  const liqLoanId = useFormField("", (v) => validatePositiveInt(v, "Loan ID"));
  const fundCircle = useFormField("", (v) => validatePositiveInt(v, "Circle ID"));
  const fundAmt = useFormField("", validateSTX);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const total = await getTotalCircles().catch(() => 0);
      const poolList: Pool[] = [];
      for (let i = 1; i <= Math.min(Number(total), 20); i++) {
        const bal = await getPoolBalance(i).catch(() => 0);
        if (Number(bal) > 0) poolList.push({ circleId: i, balance: Number(bal) });
      }
      setPools(poolList);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);
  useWindowFocus(refresh);

  const handle = async (fn: () => Promise<{ txid: string }>, msg: string) => {
    setTxPending(true);
    try {
      const res = await fn();
      toastSuccess(msg, res.txid);
      clearError();
      setTimeout(refresh, 4000);
    } catch (e) {
      setError(String(e));
    } finally {
      setTxPending(false);
    }
  };

  if (!connected) {
    return (
      <section id="loans" className="page-container">
        <div className="card alert alert-info">Connect wallet to access lending pool.</div>
      </section>
    );
  }

  const stx = (v: number) => (v / 1_000_000).toFixed(4);

  return (
    <section id="loans" className="page-container" aria-labelledby="loans-title">
      <h2 id="loans-title" className="section-title">Lending Pool</h2>
      <ErrorAlert error={contractError} onDismiss={clearError} />
      {loading && (
        <div className="grid-3" style={{ marginBottom: "1rem" }}>
          {[1,2,3].map(i => <SkeletonCard key={i} lines={2} height="80px" />)}
        </div>
      )}

      {/* Pool balances */}
      {pools.length > 0 && (
        <>
          <h3 style={{ marginBottom: "0.75rem" }}>Circle Pools</h3>
          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            {pools.map((p) => (
              <div className="card" key={p.circleId}>
                <span className="text-muted text-sm">Circle #{p.circleId}</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{stx(p.balance)} <span className="text-muted" style={{ fontSize: "0.78rem" }}>STX</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid-2">
        {/* Fund Pool */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Fund a Pool</h3>
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={fundCircle.value} onChange={fundCircle.onChange} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Amount (STX)</label>
            <input type="number" value={fundAmt.value} onChange={fundAmt.onChange} placeholder="0.0" min="0.000001" step="0.000001" />
          </div>
          <button
            className="btn-secondary"
            aria-busy={txPending}
            aria-label="Fund lending pool"
            disabled={txPending || !fundCircle.value || !fundAmt.value}
            onClick={() =>
              handle(
                () => fundPool(parseInt(fundCircle.value), Math.floor(parseFloat(fundAmt.value) * 1_000_000)),
                "Pool funded"
              )
            }
          >
            {txPending ? <span className="spinner" /> : "Fund Pool"}
          </button>
        </div>

        {/* Request Loan */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Request Loan</h3>
          <p className="text-muted text-sm" style={{ marginBottom: "0.75rem" }}>
            Loan amount is capped by your trust score × multiplier.
          </p>
          <div className="form-group">
            <label>Circle ID</label>
            <input type="number" value={reqCircle.value} onChange={reqCircle.onChange} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Amount (STX)</label>
            <input type="number" value={reqAmount.value} onChange={reqAmount.onChange} placeholder="0.0" min="0.000001" step="0.000001" />
          </div>
          <button
            className="btn-primary"
            aria-busy={txPending}
            aria-label="Request loan from pool"
            disabled={txPending || !reqCircle.value || !reqAmount.value}
            onClick={() =>
              handle(
                () => requestLoan(parseInt(reqCircle.value), Math.floor(parseFloat(reqAmount.value) * 1_000_000)),
                "Loan requested"
              )
            }
          >
            {txPending ? <span className="spinner" /> : "Request Loan"}
          </button>
        </div>

        {/* Repay Loan */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Repay Loan</h3>
          <div className="form-group">
            <label>Loan ID</label>
            <input type="number" value={repayLoanId.value} onChange={repayLoanId.onChange} placeholder="1" />
          </div>
          <div className="form-group">
            <label>Amount (STX)</label>
            <input type="number" value={repayAmt.value} onChange={repayAmt.onChange} placeholder="0.0" min="0.000001" step="0.000001" />
          </div>
          <button
            className="btn-primary"
            aria-busy={txPending}
            aria-label="Repay loan"
            disabled={txPending || !repayLoanId.value || !repayAmt.value}
            onClick={() =>
              handle(
                () => repayLoan(parseInt(repayLoanId.value), Math.floor(parseFloat(repayAmt.value) * 1_000_000)),
                "Repayment submitted"
              )
            }
          >
            {txPending ? <span className="spinner" /> : "Repay"}
          </button>
        </div>

        {/* Liquidate Defaulter */}
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Liquidate Defaulter</h3>
          <p className="text-muted text-sm" style={{ marginBottom: "0.75rem" }}>
            Call after loan due date has passed. Anyone can trigger liquidation.
          </p>
          <div className="form-group">
            <label>Loan ID</label>
            <input type="number" value={liqLoanId.value} onChange={liqLoanId.onChange} placeholder="1" />
          </div>
          <button
            className="btn-secondary"
            aria-busy={txPending}
            aria-label="Liquidate defaulted loan"
            disabled={txPending || !liqLoanId.value}
            onClick={() => handle(() => liquidateDefaulter(parseInt(liqLoanId.value)), "Liquidation submitted")}
          >
            {txPending ? <span className="spinner" /> : "Liquidate"}
          </button>
        </div>
      </div>
    </section>
  );
}
