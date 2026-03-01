;; protocol-config.clar
;; REXONOBIT -- Global Protocol Parameters & Admin
;; Governance-controlled contract holding all tunable protocol parameters.
;; Multi-sig principal guards all mutations; emergency-pause halts the protocol.

;; --- Error codes -------------------------------------------------------------
(define-constant ERR-NOT-AUTHORIZED        (err u1000))
(define-constant ERR-PARAM-NOT-FOUND       (err u1001))
(define-constant ERR-INVALID-VALUE         (err u1002))
(define-constant ERR-PROTOCOL-PAUSED       (err u1003))
(define-constant ERR-ALREADY-INITIALIZED   (err u1004))
(define-constant ERR-ZERO-VALUE            (err u1005))

;; --- Protocol version --------------------------------------------------------
(define-constant PROTOCOL-VERSION u1)

;; --- Admin principal (set once at deploy; transfer via propose-admin) ---------
(define-data-var admin principal tx-sender)
(define-data-var pending-admin (optional principal) none)

;; --- Emergency pause flag ----------------------------------------------------
(define-data-var protocol-paused bool false)

;; --- Parameter store ---------------------------------------------------------
;; All values are uint. Semantics are documented per key below.
(define-map params
  { key: (string-ascii 64) }
  { value: uint, last-updated: uint, updated-by: principal }
)

;; --- Parameter change log (append-only audit trail) -------------------------
(define-data-var param-change-nonce uint u0)
(define-map param-change-log
  { nonce: uint }
  { key: (string-ascii 64), old-value: uint, new-value: uint,
    changed-by: principal, at-block: uint }
)

;; --- Default parameter initialization ---------------------------------------
(define-data-var initialized bool false)

(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get initialized))        ERR-ALREADY-INITIALIZED)
    ;; Savings vault
    (map-set params { key: "min-deposit-ustx" }
      { value: u1000000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "savings-lock-min-blocks" }
      { value: u144, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "streak-bonus-threshold-days" }
      { value: u30, last-updated: block-height, updated-by: tx-sender })
    ;; Trust score weights (basis points, sum = 10000)
    (map-set params { key: "trust-weight-savings-bps" }
      { value: u3000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-weight-loan-repay-bps" }
      { value: u3000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-weight-endorsement-bps" }
      { value: u2000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-weight-labor-bps" }
      { value: u2000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-seed-score" }
      { value: u100, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-max-score" }
      { value: u1000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "trust-default-penalty" }
      { value: u200, last-updated: block-height, updated-by: tx-sender })
    ;; Endorsement
    (map-set params { key: "endorsement-required-count" }
      { value: u2, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "endorsement-cooldown-blocks" }
      { value: u1008, last-updated: block-height, updated-by: tx-sender })
    ;; Trust-score reward cooldowns
    (map-set params { key: "savings-reward-cooldown-blocks" }
      { value: u144, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "loan-reward-cooldown-blocks" }
      { value: u144, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "labor-reward-cooldown-blocks" }
      { value: u144, last-updated: block-height, updated-by: tx-sender })
    ;; Lending
    (map-set params { key: "loan-fee-bps" }
      { value: u200, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "loan-max-multiplier" }
      { value: u5, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "loan-min-trust-score" }
      { value: u200, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "loan-repay-window-blocks" }
      { value: u4320, last-updated: block-height, updated-by: tx-sender })
    ;; ROSCA
    (map-set params { key: "rosca-min-members" }
      { value: u3, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "rosca-max-members" }
      { value: u20, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "rosca-cycle-blocks" }
      { value: u4320, last-updated: block-height, updated-by: tx-sender })
    ;; Governance
    (map-set params { key: "governance-quorum-bps" }
      { value: u5100, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "governance-supermajority-bps" }
      { value: u6700, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "governance-vote-blocks" }
      { value: u1440, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "governance-max-vote-weight-bps" }
      { value: u2000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "governance-timelock-blocks" }
      { value: u288, last-updated: block-height, updated-by: tx-sender })
    ;; Treasury
    (map-set params { key: "treasury-large-spend-threshold" }
      { value: u10000000, last-updated: block-height, updated-by: tx-sender })
    ;; Arbitration
    (map-set params { key: "arbitration-panel-size" }
      { value: u3, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "arbitration-fee-ustx" }
      { value: u500000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "arbitration-min-trust-score" }
      { value: u500, last-updated: block-height, updated-by: tx-sender })
    ;; Synthetic credit
    (map-set params { key: "scredit-max-collateral-ratio-bps" }
      { value: u5000, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "scredit-min-trust-score" }
      { value: u700, last-updated: block-height, updated-by: tx-sender })
    ;; Circle
    (map-set params { key: "circle-min-members" }
      { value: u5, last-updated: block-height, updated-by: tx-sender })
    (map-set params { key: "circle-max-members" }
      { value: u50, last-updated: block-height, updated-by: tx-sender })
    (var-set initialized true)
    (ok true)
  )
)

;; --- Read parameter ----------------------------------------------------------
(define-read-only (get-param (key (string-ascii 64)))
  (match (map-get? params { key: key })
    entry (ok (get value entry))
    ERR-PARAM-NOT-FOUND
  )
)

(define-read-only (get-param-full (key (string-ascii 64)))
  (match (map-get? params { key: key })
    entry (ok entry)
    ERR-PARAM-NOT-FOUND
  )
)

;; --- Governance contract reference --------------------------------------------
(define-constant GOVERNANCE .governance)

;; --- Write parameter (admin or governance contract only) ----------------------
(define-public (set-param (key (string-ascii 64)) (new-value uint))
  (let (
    (caller tx-sender)
    (old-entry (unwrap! (map-get? params { key: key }) ERR-PARAM-NOT-FOUND))
    (old-value (get value old-entry))
    (nonce (+ (var-get param-change-nonce) u1))
  )
    (asserts! (or (is-eq caller (var-get admin))
                  (is-eq caller GOVERNANCE))
              ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get protocol-paused))  ERR-PROTOCOL-PAUSED)
    (asserts! (> new-value u0)                 ERR-ZERO-VALUE)
    (map-set params { key: key }
      { value: new-value, last-updated: block-height, updated-by: caller })
    (map-set param-change-log { nonce: nonce }
      { key: key, old-value: old-value, new-value: new-value,
        changed-by: caller, at-block: block-height })
    (var-set param-change-nonce nonce)
    (ok true)
  )
)

;; --- Emergency pause / resume ------------------------------------------------
(define-public (emergency-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused true)
    (ok true)
  )
)

(define-public (resume-protocol)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused false)
    (ok true)
  )
)

;; --- Admin transfer (2-step) -------------------------------------------------
(define-public (propose-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set pending-admin (some new-admin))
    (ok true)
  )
)

(define-public (accept-admin)
  (let ((candidate (unwrap! (var-get pending-admin) ERR-NOT-AUTHORIZED)))
    (asserts! (is-eq tx-sender candidate) ERR-NOT-AUTHORIZED)
    (var-set admin candidate)
    (var-set pending-admin none)
    (ok true)
  )
)

;; --- Read-only helpers -------------------------------------------------------
(define-read-only (get-admin)         (ok (var-get admin)))
(define-read-only (get-pending-admin) (ok (var-get pending-admin)))
(define-read-only (is-paused)         (ok (var-get protocol-paused)))
(define-read-only (get-version)       (ok PROTOCOL-VERSION))
(define-read-only (is-initialized)    (ok (var-get initialized)))

(define-read-only (get-param-change (nonce uint))
  (match (map-get? param-change-log { nonce: nonce })
    entry (ok entry)
    ERR-PARAM-NOT-FOUND
  )
)

(define-read-only (get-total-param-changes)
  (ok (var-get param-change-nonce))
)
