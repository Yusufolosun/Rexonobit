;; trust-score.clar
;; REXONOBIT — On-Chain Credit Reputation
;; Non-transferable, soulbound credit score derived from:
;;   savings consistency, loan repayment, circle endorsements, labor completion.
;; Every input has cooldown guards to prevent gaming.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u300))
(define-constant ERR-NOT-A-MEMBER        (err u301))
(define-constant ERR-SCORE-NOT-FOUND     (err u302))
(define-constant ERR-COOLDOWN-ACTIVE     (err u303))
(define-constant ERR-INVALID-AMOUNT      (err u304))
(define-constant ERR-PROTOCOL-PAUSED     (err u305))
(define-constant ERR-UNAUTHORIZED-CALLER (err u306))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY      .cooperative-registry)
(define-constant PROTOCOL-CFG  .protocol-config)

;; ─── Authorized caller contracts ─────────────────────────────────────────────
;; Only these contracts may write to trust scores.
(define-map authorized-writers { writer: principal } { enabled: bool })

;; ─── Score record ────────────────────────────────────────────────────────────
(define-map trust-scores
  { member: principal }
  {
    score:                   uint,
    savings-points:          uint,
    loan-repay-points:       uint,
    endorsement-points:      uint,
    labor-points:            uint,
    defaults:                uint,
    last-savings-reward:     uint,   ;; block-height
    last-loan-reward:        uint,
    last-endorsement-reward: uint,
    last-labor-reward:       uint,
    last-penalty:            uint,
    initialized-at:          uint
  }
)

;; ─── Score change audit log ──────────────────────────────────────────────────
(define-data-var score-event-nonce uint u0)
(define-map score-events
  { nonce: uint }
  {
    member:    principal,
    delta:     int,         ;; positive = reward, negative = penalty
    reason:    (string-ascii 32),
    caller:    principal,
    at-block:  uint
  }
)

;; ─── Admin ───────────────────────────────────────────────────────────────────
(define-data-var admin principal tx-sender)

;; ─── Initialize a member's trust profile ────────────────────────────────────
(define-public (initialize-score (member principal))
  (let ((seed (default-to u100
          (match (contract-call? PROTOCOL-CFG get-param "trust-seed-score")
            v (some v) none))))
    (asserts! (not (is-protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (contract-call? REGISTRY is-active-member member) ERR-NOT-A-MEMBER)
    (asserts! (is-none (map-get? trust-scores { member: member })) ERR-NOT-AUTHORIZED)
    (map-set trust-scores { member: member }
      { score: seed,
        savings-points:          u0,
        loan-repay-points:       u0,
        endorsement-points:      u0,
        labor-points:            u0,
        defaults:                u0,
        last-savings-reward:     u0,
        last-loan-reward:        u0,
        last-endorsement-reward: u0,
        last-labor-reward:       u0,
        last-penalty:            u0,
        initialized-at:          block-height })
    (ok seed)
  )
)

;; ─── Internal: safe-add capped at max-score ──────────────────────────────────
(define-private (add-to-score (current uint) (delta uint) (max-score uint))
  (let ((new-val (+ current delta)))
    (if (> new-val max-score) max-score new-val)
  )
)

;; ─── Internal: safe-sub floored at 0 ────────────────────────────────────────
(define-private (sub-from-score (current uint) (delta uint))
  (if (>= current delta) (- current delta) u0)
)

;; ─── Internal: record event ──────────────────────────────────────────────────
(define-private (record-event (member principal) (delta int) (reason (string-ascii 32)))
  (let ((n (+ (var-get score-event-nonce) u1)))
    (map-set score-events { nonce: n }
      { member: member, delta: delta, reason: reason,
        caller: tx-sender, at-block: block-height })
    (var-set score-event-nonce n)
  )
)

;; ─── Internal: max-score helper ──────────────────────────────────────────────
(define-private (get-max-score)
  (default-to u1000
    (match (contract-call? PROTOCOL-CFG get-param "trust-max-score")
      v (some v) none))
)

;; ─── Reward: savings deposit ─────────────────────────────────────────────────
(define-public (reward-savings (member principal) (points uint))
  (let (
    (entry      (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND))
    (cooldown   (default-to u144
                  (match (contract-call? PROTOCOL-CFG get-param "endorsement-cooldown-blocks")
                    v (some v) none)))
    (since-last (- block-height (get last-savings-reward entry)))
  )
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (asserts! (> points u0)                    ERR-INVALID-AMOUNT)
    (asserts! (>= since-last cooldown)         ERR-COOLDOWN-ACTIVE)
    (let ((new-score (add-to-score (get score entry) points (get-max-score))))
      (map-set trust-scores { member: member }
        (merge entry
          { score: new-score,
            savings-points: (+ (get savings-points entry) points),
            last-savings-reward: block-height }))
      (record-event member (to-int points) "savings-reward")
      (ok new-score)
    )
  )
)

;; ─── Reward: loan repayment ──────────────────────────────────────────────────
(define-public (reward-loan-repay (member principal) (points uint))
  (let ((entry (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND)))
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (asserts! (> points u0)                    ERR-INVALID-AMOUNT)
    (let ((new-score (add-to-score (get score entry) points (get-max-score))))
      (map-set trust-scores { member: member }
        (merge entry
          { score: new-score,
            loan-repay-points: (+ (get loan-repay-points entry) points),
            last-loan-reward: block-height }))
      (record-event member (to-int points) "loan-repay-reward")
      (ok new-score)
    )
  )
)

;; ─── Reward: circle endorsement ──────────────────────────────────────────────
(define-public (reward-endorsement (member principal) (points uint))
  (let (
    (entry    (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND))
    (cooldown (default-to u1008
                (match (contract-call? PROTOCOL-CFG get-param "endorsement-cooldown-blocks")
                  v (some v) none)))
    (since    (- block-height (get last-endorsement-reward entry)))
  )
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (asserts! (> points u0)                    ERR-INVALID-AMOUNT)
    (asserts! (>= since cooldown)              ERR-COOLDOWN-ACTIVE)
    (let ((new-score (add-to-score (get score entry) points (get-max-score))))
      (map-set trust-scores { member: member }
        (merge entry
          { score: new-score,
            endorsement-points: (+ (get endorsement-points entry) points),
            last-endorsement-reward: block-height }))
      (record-event member (to-int points) "endorsement-reward")
      (ok new-score)
    )
  )
)

;; ─── Reward: labor task completion ───────────────────────────────────────────
(define-public (reward-labor (member principal) (points uint))
  (let ((entry (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND)))
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (asserts! (> points u0)                    ERR-INVALID-AMOUNT)
    (let ((new-score (add-to-score (get score entry) points (get-max-score))))
      (map-set trust-scores { member: member }
        (merge entry
          { score: new-score,
            labor-points: (+ (get labor-points entry) points),
            last-labor-reward: block-height }))
      (record-event member (to-int points) "labor-reward")
      (ok new-score)
    )
  )
)

;; ─── Penalize: loan default, task fraud, etc. ────────────────────────────────
(define-public (penalize (member principal) (points uint) (reason (string-ascii 32)))
  (let ((entry (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND)))
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (asserts! (> points u0)                    ERR-INVALID-AMOUNT)
    (let ((new-score (sub-from-score (get score entry) points)))
      (map-set trust-scores { member: member }
        (merge entry
          { score: new-score,
            defaults: (+ (get defaults entry) u1),
            last-penalty: block-height }))
      (record-event member (* -1 (to-int points)) reason)
      (ok new-score)
    )
  )
)

;; ─── Full reset on severe default ────────────────────────────────────────────
(define-public (reset-on-default (member principal))
  (let ((entry (unwrap! (map-get? trust-scores { member: member }) ERR-SCORE-NOT-FOUND)))
    (asserts! (is-authorized-writer tx-sender) ERR-UNAUTHORIZED-CALLER)
    (map-set trust-scores { member: member }
      (merge entry
        { score: u0, defaults: (+ (get defaults entry) u1),
          last-penalty: block-height }))
    (record-event member (* -1 (to-int (get score entry))) "full-reset-default")
    (ok true)
  )
)

;; ─── Authorize / deauthorize a writer contract ───────────────────────────────
(define-public (set-authorized-writer (writer principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set authorized-writers { writer: writer } { enabled: enabled })
    (ok true)
  )
)

(define-read-only (is-authorized-writer (writer principal))
  (match (map-get? authorized-writers { writer: writer })
    entry (get enabled entry)
    false
  )
)

;; ─── Read-only ───────────────────────────────────────────────────────────────
(define-read-only (get-score (member principal))
  (match (map-get? trust-scores { member: member })
    entry (ok (get score entry))
    ERR-SCORE-NOT-FOUND
  )
)

(define-read-only (get-score-full (member principal))
  (match (map-get? trust-scores { member: member })
    entry (ok entry)
    ERR-SCORE-NOT-FOUND
  )
)

(define-read-only (has-score (member principal))
  (is-some (map-get? trust-scores { member: member }))
)

(define-read-only (meets-threshold (member principal) (threshold uint))
  (match (map-get? trust-scores { member: member })
    entry (ok (>= (get score entry) threshold))
    (ok false)
  )
)

(define-read-only (get-score-event (nonce uint))
  (map-get? score-events { nonce: nonce })
)

(define-read-only (get-total-events)
  (ok (var-get score-event-nonce))
)

;; ─── Internal: paused flag ───────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused)
    v v
    false
  )
)
