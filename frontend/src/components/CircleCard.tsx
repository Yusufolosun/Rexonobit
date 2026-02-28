// frontend/src/components/CircleCard.tsx
// Displays a single cooperative circle with member count and actions


export interface Circle {
  id: number;
  name: string;
  admin: string;
  memberCount: number;
  status: "active" | "suspended" | "dissolved";
  minTrustScore: number;
  maxMembers: number;
  description: string;
}

interface Props {
  circle: Circle;
  isMember: boolean;
  onJoin?: (circleId: number) => void;
  onVouch?: (circleId: number) => void;
  txPending?: boolean;
  currentAddress?: string;
}

const statusColors: Record<Circle["status"], string> = {
  active: "#10b981",
  suspended: "#f59e0b",
  dissolved: "#ef4444",
};

export default function CircleCard({ circle, isMember, onJoin, onVouch, txPending, currentAddress }: Props) {
  const isAdmin = currentAddress?.toLowerCase() === circle.admin?.toLowerCase();
  const full = circle.memberCount >= circle.maxMembers;

  return (
    <div
      className="card"
      role="article"
      aria-label={`${circle.name} cooperative circle, ${circle.status}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <h3 style={{ marginBottom: "0.15rem", fontSize: "1.05rem" }}>{circle.name}</h3>
          <span
            className="badge"
            style={{
              background: statusColors[circle.status],
              color: "#0a0a0a",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            {circle.status.toUpperCase()}
          </span>
        </div>
        {isAdmin && (
          <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>ADMIN</span>
        )}
      </div>

      {circle.description && (
        <p className="text-muted text-sm" style={{ marginBottom: "0.75rem", lineHeight: 1.5 }}>
          {circle.description}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        <div>
          <span className="text-muted" style={{ fontSize: "0.72rem", display: "block" }}>Members</span>
          <strong>{circle.memberCount} / {circle.maxMembers}</strong>
        </div>
        <div>
          <span className="text-muted" style={{ fontSize: "0.72rem", display: "block" }}>Min Trust</span>
          <strong>{circle.minTrustScore}</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {!isMember && circle.status === "active" && !full && (
          <button
            className="btn-primary"
            style={{ flex: 1, padding: "0.45rem" }}
            disabled={txPending}
            aria-busy={txPending}
            aria-label={`Request to join ${circle.name}`}
            onClick={() => onJoin?.(circle.id)}
          >
            {txPending ? <span className="spinner" /> : "Request to Join"}
          </button>
        )}
        {isMember && (
          <button
            className="btn-secondary"
            style={{ flex: 1, padding: "0.45rem" }}
            disabled={txPending}
            aria-busy={txPending}
            aria-label={`Vouch a member for ${circle.name}`}
            onClick={() => onVouch?.(circle.id)}
          >
            Vouch Member
          </button>
        )}
        {full && !isMember && (
          <span className="text-muted text-sm" style={{ alignSelf: "center" }}>Circle is full</span>
        )}
      </div>
    </div>
  );
}
