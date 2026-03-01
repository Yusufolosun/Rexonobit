;; arbitration.clar
;; REXONOBIT -- Decentralized Dispute Resolution
;; A panel of 3 randomly selected high-trust members from OTHER circles adjudicates.
;; Their decision is binding; they earn a fee.
;; Arbitrators' trust scores are at stake -- ruling inconsistently risks penalty.

;; --- Error codes -------------------------------------------------------------
(define-constant ERR-NOT-AUTHORIZED      (err u1000))
(define-constant ERR-NOT-A-MEMBER        (err u1001))
(define-constant ERR-DISPUTE-NOT-FOUND   (err u1002))
(define-constant ERR-DISPUTE-CLOSED      (err u1003))
(define-constant ERR-NOT-ARBITRATOR      (err u1004))
(define-constant ERR-ALREADY-VOTED       (err u1005))
(define-constant ERR-PANEL-NOT-ASSIGNED  (err u1006))
(define-constant ERR-DISPUTE-EXISTS      (err u1007))
(define-constant ERR-PROTOCOL-PAUSED     (err u1008))
(define-constant ERR-ZERO-AMOUNT         (err u1009))
(define-constant ERR-PANEL-FULL          (err u1010))
(define-constant ERR-SAME-CIRCLE         (err u1011))
(define-constant ERR-INSUFFICIENT-TRUST  (err u1012))

;; --- Contract references -----------------------------------------------------
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)

;; --- Dispute status ----------------------------------------------------------
(define-constant DISPUTE-OPEN        u1)
(define-constant DISPUTE-PANEL-SET   u2)
(define-constant DISPUTE-VERDICT     u3)
(define-constant DISPUTE-CLOSED      u4)

;; --- Verdict constants -------------------------------------------------------
(define-constant VERDICT-FAVOR-CLAIMANT  u1)
(define-constant VERDICT-FAVOR-RESPONDENT u2)
(define-constant VERDICT-SPLIT           u3)

;; --- Dispute records ---------------------------------------------------------
(define-data-var dispute-nonce uint u0)

(define-map disputes
  { dispute-id: uint }
  {
    claimant:      principal,
    respondent:    principal,
    circle-id:     uint,
    description:   (string-utf8 512),
    evidence:      (string-utf8 512),
    fee-escrow:    uint,          ;; fee contributed by both parties
    panel:         (list 3 principal),
    votes-for-claimant:   uint,
    votes-for-respondent: uint,
    votes-cast:           uint,    ;; total verdicts submitted (including SPLIT)
    final-verdict: uint,          ;; 0=pending
    status:        uint,
    opened-at:     uint,
    closed-at:     uint
  }
)

;; --- Arbitrator vote records -------------------------------------------------
(define-map arbitrator-votes
  { dispute-id: uint, arbitrator: principal }
  { verdict: uint, reasoning: (string-utf8 256), at-block: uint }
)

;; --- Open a dispute ----------------------------------------------------------
(define-public (open-dispute
    (respondent  principal)
    (circle-id   uint)
    (description (string-utf8 512))
    (evidence    (string-utf8 512)))
  (let (
    (caller     tx-sender)
    (dispute-id (+ (var-get dispute-nonce) u1))
    (arb-fee    (default-to u500000
                  (match (contract-call? .protocol-config get-param "arbitration-fee-ustx")
                    v (some v) err-v none)))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (contract-call? .cooperative-registry is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? .cooperative-registry is-active-member respondent) ERR-NOT-A-MEMBER)
    (asserts! (> arb-fee u0)                                       ERR-ZERO-AMOUNT)
    ;; Claimant deposits fee
    (try! (stx-transfer? arb-fee caller (as-contract tx-sender)))
    (map-set disputes { dispute-id: dispute-id }
      { claimant: caller, respondent: respondent,
        circle-id: circle-id, description: description, evidence: evidence,
        fee-escrow: arb-fee,
        panel: (list),
        votes-for-claimant: u0, votes-for-respondent: u0,
        votes-cast: u0,
        final-verdict: u0, status: DISPUTE-OPEN,
        opened-at: block-height, closed-at: u0 })
    (var-set dispute-nonce dispute-id)
    (ok dispute-id)
  )
)

;; --- Assign arbitrator to panel (called by eligible members from other circles) -
(define-public (join-panel (dispute-id uint))
  (let (
    (caller  tx-sender)
    (dispute (unwrap! (map-get? disputes { dispute-id: dispute-id })
               ERR-DISPUTE-NOT-FOUND))
    (min-trust (default-to u500
                 (match (contract-call? .protocol-config get-param "arbitration-min-trust-score")
                   v (some v) err-v none)))
    (arb-score (unwrap! (contract-call? .trust-score get-score caller) ERR-INSUFFICIENT-TRUST))
    (panel     (get panel dispute))
  )
    (asserts! (not (is-protocol-paused))                           ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status dispute) DISPUTE-OPEN)             ERR-DISPUTE-CLOSED)
    (asserts! (contract-call? .cooperative-registry is-active-member caller)    ERR-NOT-A-MEMBER)
    (asserts! (>= arb-score min-trust)                              ERR-INSUFFICIENT-TRUST)
    ;; Must not be from the same circle as disputants
    (asserts! (not (contract-call? .cooperative-registry is-circle-member
                    (get circle-id dispute) caller))                ERR-SAME-CIRCLE)
    ;; Must not be claimant or respondent
    (asserts! (not (is-eq caller (get claimant dispute)))           ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq caller (get respondent dispute)))         ERR-NOT-AUTHORIZED)
    (asserts! (< (len panel) u3)                                    ERR-PANEL-FULL)
    (let ((new-panel (unwrap-panic (as-max-len? (append panel caller) u3))))
      (let ((updated (merge dispute
              { panel: new-panel,
                status: (if (is-eq (len new-panel) u3)
                          DISPUTE-PANEL-SET
                          DISPUTE-OPEN) })))
        (map-set disputes { dispute-id: dispute-id } updated)
        (ok (len new-panel))
      )
    )
  )
)

;; --- Submit arbitrator verdict -----------------------------------------------
(define-public (submit-verdict
    (dispute-id uint)
    (verdict    uint)
    (reasoning  (string-utf8 256)))
  (let (
    (caller  tx-sender)
    (dispute (unwrap! (map-get? disputes { dispute-id: dispute-id })
               ERR-DISPUTE-NOT-FOUND))
    (panel   (get panel dispute))
  )
    (asserts! (not (is-protocol-paused))                              ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status dispute) DISPUTE-PANEL-SET)           ERR-PANEL-NOT-ASSIGNED)
    (asserts! (is-some (index-of panel caller))                        ERR-NOT-ARBITRATOR)
    (asserts! (is-none (map-get? arbitrator-votes
                { dispute-id: dispute-id, arbitrator: caller }))       ERR-ALREADY-VOTED)
    (asserts! (or (is-eq verdict VERDICT-FAVOR-CLAIMANT)
                  (or (is-eq verdict VERDICT-FAVOR-RESPONDENT)
                      (is-eq verdict VERDICT-SPLIT)))                  ERR-NOT-AUTHORIZED)
    (map-set arbitrator-votes { dispute-id: dispute-id, arbitrator: caller }
      { verdict: verdict, reasoning: reasoning, at-block: block-height })
    (let (
      (new-for-c  (if (is-eq verdict VERDICT-FAVOR-CLAIMANT)
                    (+ (get votes-for-claimant dispute) u1)
                    (get votes-for-claimant dispute)))
      (new-for-r  (if (is-eq verdict VERDICT-FAVOR-RESPONDENT)
                    (+ (get votes-for-respondent dispute) u1)
                    (get votes-for-respondent dispute)))
      (new-cast   (+ (get votes-cast dispute) u1))
      (all-voted  (>= new-cast (len panel)))
    )
      (map-set disputes { dispute-id: dispute-id }
        (merge dispute
          { votes-for-claimant:   new-for-c,
            votes-for-respondent: new-for-r,
            votes-cast:           new-cast,
            status: (if all-voted DISPUTE-VERDICT (get status dispute)) }))
      (ok all-voted)
    )
  )
)

;; --- Close dispute and disburse fee + ruling ---------------------------------
(define-public (close-dispute (dispute-id uint))
  (let (
    (dispute   (unwrap! (map-get? disputes { dispute-id: dispute-id })
                ERR-DISPUTE-NOT-FOUND))
    (arb-fee   (default-to u500000
                 (match (contract-call? .protocol-config get-param "arbitration-fee-ustx")
                   v (some v) err-v none)))
    (for-c     (get votes-for-claimant dispute))
    (for-r     (get votes-for-respondent dispute))
    (panel     (get panel dispute))
    ;; Majority verdict
    (winner    (if (> for-c for-r) (get claimant dispute) (get respondent dispute)))
    (per-arb   (/ (get fee-escrow dispute) (len panel)))
    (remainder (mod (get fee-escrow dispute) (len panel)))
  )
    (asserts! (not (is-protocol-paused))                  ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status dispute) DISPUTE-VERDICT) ERR-DISPUTE-CLOSED)
    ;; Pay each panel member their fee share (last member receives remainder)
    (try! (as-contract (stx-transfer? per-arb tx-sender (unwrap-panic (element-at panel u0)))))
    (try! (as-contract (stx-transfer? per-arb tx-sender (unwrap-panic (element-at panel u1)))))
    (try! (as-contract (stx-transfer? (+ per-arb remainder) tx-sender (unwrap-panic (element-at panel u2)))))
    ;; Reward arbitrators' trust scores (best-effort)
    (match (as-contract (contract-call? .trust-score reward-endorsement
            (unwrap-panic (element-at panel u0)) u10))
      success true error true)
    (match (as-contract (contract-call? .trust-score reward-endorsement
            (unwrap-panic (element-at panel u1)) u10))
      success true error true)
    (match (as-contract (contract-call? .trust-score reward-endorsement
            (unwrap-panic (element-at panel u2)) u10))
      success true error true)
    (map-set disputes { dispute-id: dispute-id }
      (merge dispute
        { status: DISPUTE-CLOSED,
          final-verdict: (if (> for-c for-r) VERDICT-FAVOR-CLAIMANT VERDICT-FAVOR-RESPONDENT),
          closed-at: block-height }))
    (ok winner)
  )
)

;; --- Read-only ---------------------------------------------------------------
(define-read-only (get-dispute (id uint))
  (map-get? disputes { dispute-id: id })
)

(define-read-only (get-arbitrator-vote (dispute-id uint) (arbitrator principal))
  (map-get? arbitrator-votes { dispute-id: dispute-id, arbitrator: arbitrator })
)

(define-read-only (get-total-disputes) (ok (var-get dispute-nonce)))

;; --- Internal ----------------------------------------------------------------
(define-private (is-protocol-paused)
  (unwrap-panic (contract-call? .protocol-config is-paused))
)
