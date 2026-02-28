;; synthetic-credit.clar
;; REXONOBIT — BTC-Denominated Synthetic Credit Line (sCREDIT)
;; High-trust members (score > threshold) mint sCREDIT backed by:
;;   - Locked sBTC/STX in savings-vault (hard collateral)
;;   - Trust score (behavioral proof = access gate, NOT extra collateral)
;; sCREDIT cannot exceed 50% of locked savings value.
;; Used within the ecosystem: tasks, ROSCAs, services — NOT freely liquidatable.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u1100))
(define-constant ERR-NOT-A-MEMBER        (err u1101))
(define-constant ERR-INSUFFICIENT-TRUST  (err u1102))
(define-constant ERR-EXCEEDS-LIMIT       (err u1103))
(define-constant ERR-ZERO-AMOUNT         (err u1104))
(define-constant ERR-INSUFFICIENT-CREDIT (err u1105))
(define-constant ERR-NO-LOCKED-SAVINGS   (err u1106))
(define-constant ERR-PROTOCOL-PAUSED     (err u1107))
(define-constant ERR-ACCOUNT-NOT-FOUND   (err u1108))
(define-constant ERR-TRANSFER-FAILED     (err u1109))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant VAULT        .savings-vault)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── sCREDIT fungible token ──────────────────────────────────────────────────
(define-fungible-token scredit)

;; ─── Credit account per member ───────────────────────────────────────────────
(define-map credit-accounts
  { member: principal }
  {
    minted:       uint,    ;; total sCREDIT minted by this member
    credit-limit: uint,    ;; current computed limit in microSTX-equivalent
    last-updated: uint
  }
)

;; ─── Mint event log ──────────────────────────────────────────────────────────
(define-data-var mint-nonce uint u0)
(define-map mint-events
  { nonce: uint }
  { member: principal, amount: uint, limit-at-mint: uint, at-block: uint }
)

;; ─── Compute credit limit ────────────────────────────────────────────────────
;; limit = locked-savings × (scredit-max-collateral-ratio-bps / 10000)
(define-read-only (compute-credit-limit (member principal))
  (let (
    (locked  (unwrap! (contract-call? VAULT get-locked-balance member)
               ERR-NO-LOCKED-SAVINGS))
    (ratio   (default-to u5000
               (match (contract-call? PROTOCOL-CFG get-param "scredit-max-collateral-ratio-bps")
                 v (some v) none)))
  )
    (ok (/ (* locked ratio) u10000))
  )
)

;; ─── Mint sCREDIT ────────────────────────────────────────────────────────────
(define-public (mint-scredit (amount uint))
  (let (
    (caller    tx-sender)
    (min-trust (default-to u700
                 (match (contract-call? PROTOCOL-CFG get-param "scredit-min-trust-score")
                   v (some v) none)))
    (score     (unwrap! (contract-call? TRUST get-score caller) ERR-INSUFFICIENT-TRUST))
    (limit     (unwrap! (compute-credit-limit caller) ERR-NO-LOCKED-SAVINGS))
    (account   (default-to
                 { minted: u0, credit-limit: u0, last-updated: u0 }
                 (map-get? credit-accounts { member: caller })))
    (already-minted (get minted account))
    (available      (if (> limit already-minted) (- limit already-minted) u0))
    (nonce          (+ (var-get mint-nonce) u1))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                        ERR-ZERO-AMOUNT)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (>= score min-trust)                                 ERR-INSUFFICIENT-TRUST)
    (asserts! (<= amount available)                                ERR-EXCEEDS-LIMIT)
    (try! (ft-mint? scredit amount caller))
    (map-set credit-accounts { member: caller }
      { minted: (+ already-minted amount),
        credit-limit: limit,
        last-updated: block-height })
    (map-set mint-events { nonce: nonce }
      { member: caller, amount: amount,
        limit-at-mint: limit, at-block: block-height })
    (var-set mint-nonce nonce)
    (ok amount)
  )
)

;; ─── Burn sCREDIT (repay credit, freeing up limit) ───────────────────────────
(define-public (burn-scredit (amount uint))
  (let (
    (caller  tx-sender)
    (account (unwrap! (map-get? credit-accounts { member: caller }) ERR-ACCOUNT-NOT-FOUND))
    (balance (ft-get-balance scredit caller))
  )
    (asserts! (not (is-protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)              ERR-ZERO-AMOUNT)
    (asserts! (>= balance amount)        ERR-INSUFFICIENT-CREDIT)
    (try! (ft-burn? scredit amount caller))
    (map-set credit-accounts { member: caller }
      (merge account
        { minted: (if (>= (get minted account) amount)
                    (- (get minted account) amount)
                    u0),
          last-updated: block-height }))
    (ok true)
  )
)

;; ─── Transfer sCREDIT within the ecosystem ───────────────────────────────────
;; Moves both the token balance AND the minted obligation from sender to
;; recipient, keeping credit-account bookkeeping accurate.
(define-public (transfer-scredit (amount uint) (recipient principal))
  (let (
    (caller          tx-sender)
    (sender-account  (unwrap! (map-get? credit-accounts { member: caller })
                       ERR-ACCOUNT-NOT-FOUND))
    (sender-minted   (get minted sender-account))
    (recipient-acct  (default-to
                       { minted: u0, credit-limit: u0, last-updated: u0 }
                       (map-get? credit-accounts { member: recipient })))
  )
    (asserts! (not (is-protocol-paused))                           ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                         ERR-ZERO-AMOUNT)
    (asserts! (contract-call? REGISTRY is-active-member recipient)  ERR-NOT-A-MEMBER)
    (asserts! (>= (ft-get-balance scredit caller) amount)           ERR-INSUFFICIENT-CREDIT)
    ;; Transfer the fungible token
    (try! (ft-transfer? scredit amount caller recipient))
    ;; Reduce sender's minted obligation
    (map-set credit-accounts { member: caller }
      (merge sender-account
        { minted: (if (>= sender-minted amount)
                    (- sender-minted amount)
                    u0),
          last-updated: block-height }))
    ;; Increase recipient's minted obligation
    (map-set credit-accounts { member: recipient }
      (merge recipient-acct
        { minted: (+ (get minted recipient-acct) amount),
          last-updated: block-height }))
    (ok true)
  )
)

;; ─── Read-only ───────────────────────────────────────────────────────────────
(define-read-only (get-credit-limit (member principal))
  (compute-credit-limit member)
)

(define-read-only (get-scredit-balance (member principal))
  (ok (ft-get-balance scredit member))
)

(define-read-only (get-credit-account (member principal))
  (map-get? credit-accounts { member: member })
)

(define-read-only (get-available-credit (member principal))
  (match (map-get? credit-accounts { member: member })
    account
      (match (compute-credit-limit member)
        limit (let ((minted (get minted account)))
                (ok (if (> limit minted) (- limit minted) u0)))
        e (err u0))
    (compute-credit-limit member)
  )
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply scredit))
)

(define-read-only (get-mint-event (nonce uint))
  (map-get? mint-events { nonce: nonce })
)

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)
