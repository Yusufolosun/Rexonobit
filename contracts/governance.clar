;; governance.clar
;; REXONOBIT — Circle-Level Democratic Governance
;; Voting weight = trust score (soulbound, not token balance).
;; Any single member's weight is capped at 20% of total circle weight.
;; Proposals: loan policy changes, task rates, member expulsion, treasury spends.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u700))
(define-constant ERR-NOT-A-MEMBER        (err u701))
(define-constant ERR-PROPOSAL-NOT-FOUND  (err u702))
(define-constant ERR-ALREADY-VOTED       (err u703))
(define-constant ERR-VOTE-CLOSED         (err u704))
(define-constant ERR-PROPOSAL-EXECUTED   (err u705))
(define-constant ERR-NOT-IN-CIRCLE       (err u706))
(define-constant ERR-QUORUM-NOT-MET      (err u707))
(define-constant ERR-TIMELOCK-ACTIVE     (err u708))
(define-constant ERR-VETO-EXPIRED        (err u709))
(define-constant ERR-PROTOCOL-PAUSED     (err u710))
(define-constant ERR-INVALID-TYPE        (err u711))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── Proposal types ──────────────────────────────────────────────────────────
(define-constant PROPOSAL-PARAM-CHANGE   u1)
(define-constant PROPOSAL-EXPEL-MEMBER   u2)
(define-constant PROPOSAL-TREASURY-SPEND u3)
(define-constant PROPOSAL-POLICY-UPDATE  u4)

;; ─── Proposal status ─────────────────────────────────────────────────────────
(define-constant STATUS-OPEN     u1)
(define-constant STATUS-APPROVED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)
(define-constant STATUS-VETOED   u5)

;; ─── Proposal store ──────────────────────────────────────────────────────────
(define-data-var proposal-nonce uint u0)

(define-map proposals
  { proposal-id: uint }
  {
    circle-id:       uint,
    proposer:        principal,
    proposal-type:   uint,
    title:           (string-utf8 128),
    description:     (string-utf8 512),
    param-key:       (string-ascii 64),   ;; for param-change proposals
    param-value:     uint,
    target:          (optional principal),
    yes-weight:      uint,
    no-weight:       uint,
    total-weight:    uint,
    voter-count:     uint,
    status:          uint,
    created-at:      uint,
    vote-until:      uint,
    execute-after:   uint,
    executed-at:     uint
  }
)

;; ─── Vote records ────────────────────────────────────────────────────────────
(define-map gov-votes
  { proposal-id: uint, voter: principal }
  { weight: uint, approve: bool, at-block: uint }
)

;; ─── Create proposal ─────────────────────────────────────────────────────────
(define-public (propose
    (circle-id uint)
    (proposal-type uint)
    (title (string-utf8 128))
    (description (string-utf8 512))
    (param-key (string-ascii 64))
    (param-value uint)
    (target (optional principal)))
  (let (
    (caller      tx-sender)
    (proposal-id (+ (var-get proposal-nonce) u1))
    (vote-blocks (default-to u1440
                   (match (contract-call? PROTOCOL-CFG get-param "governance-vote-blocks")
                     v (some v) none)))
    (timelock    (default-to u288
                   (match (contract-call? PROTOCOL-CFG get-param "governance-timelock-blocks")
                     v (some v) none)))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? REGISTRY is-circle-member circle-id caller) ERR-NOT-IN-CIRCLE)
    (asserts! (or (is-eq proposal-type PROPOSAL-PARAM-CHANGE)
                  (or (is-eq proposal-type PROPOSAL-EXPEL-MEMBER)
                      (or (is-eq proposal-type PROPOSAL-TREASURY-SPEND)
                          (is-eq proposal-type PROPOSAL-POLICY-UPDATE))))
              ERR-INVALID-TYPE)
    (map-set proposals { proposal-id: proposal-id }
      { circle-id: circle-id, proposer: caller,
        proposal-type: proposal-type,
        title: title, description: description,
        param-key: param-key, param-value: param-value,
        target: target,
        yes-weight: u0, no-weight: u0, total-weight: u0,
        voter-count: u0, status: STATUS-OPEN,
        created-at: block-height,
        vote-until: (+ block-height vote-blocks),
        execute-after: (+ block-height vote-blocks timelock),
        executed-at: u0 })
    (var-set proposal-nonce proposal-id)
    (ok proposal-id)
  )
)

;; ─── Vote (weight = trust score, capped at 20% of total) ─────────────────────
(define-public (vote (proposal-id uint) (approve bool))
  (let (
    (caller   tx-sender)
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id })
               ERR-PROPOSAL-NOT-FOUND))
    (raw-score (unwrap! (contract-call? TRUST get-score caller) ERR-NOT-A-MEMBER))
    (max-weight-bps (default-to u2000
                     (match (contract-call? PROTOCOL-CFG get-param "governance-max-vote-weight-bps")
                       v (some v) none)))
    ;; Cap weight at 20% of cumulative total-weight so far
    (total-so-far   (get total-weight proposal))
    (uncapped-pct   (if (> total-so-far u0)
                      (/ (* raw-score u10000) total-so-far)
                      u10000))
    (effective-weight (if (> uncapped-pct max-weight-bps)
                        ;; Scale down to max
                        (/ (* total-so-far max-weight-bps) u10000)
                        raw-score))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status proposal) STATUS-OPEN)            ERR-VOTE-CLOSED)
    (asserts! (<= block-height (get vote-until proposal))          ERR-VOTE-CLOSED)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? REGISTRY is-circle-member
                (get circle-id proposal) caller)                   ERR-NOT-IN-CIRCLE)
    (asserts! (is-none (map-get? gov-votes
                { proposal-id: proposal-id, voter: caller }))      ERR-ALREADY-VOTED)
    (map-set gov-votes { proposal-id: proposal-id, voter: caller }
      { weight: effective-weight, approve: approve, at-block: block-height })
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal
        { yes-weight:   (if approve
                          (+ (get yes-weight proposal) effective-weight)
                          (get yes-weight proposal)),
          no-weight:    (if approve
                          (get no-weight proposal)
                          (+ (get no-weight proposal) effective-weight)),
          total-weight: (+ (get total-weight proposal) effective-weight),
          voter-count:  (+ (get voter-count proposal) u1) }))
    (ok effective-weight)
  )
)

;; ─── Execute proposal (after vote closes + timelock, if quorum + supermajority) ──
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal   (unwrap! (map-get? proposals { proposal-id: proposal-id })
                 ERR-PROPOSAL-NOT-FOUND))
    (quorum-bps (default-to u5100
                  (match (contract-call? PROTOCOL-CFG get-param "governance-quorum-bps")
                    v (some v) none)))
    (supermaj   (default-to u6700
                  (match (contract-call? PROTOCOL-CFG get-param "governance-supermajority-bps")
                    v (some v) none)))
    (total-w    (get total-weight proposal))
    (yes-w      (get yes-weight proposal))
    (yes-bps    (if (> total-w u0) (/ (* yes-w u10000) total-w) u0))
  )
    (asserts! (not (is-protocol-paused))                             ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status proposal) STATUS-OPEN)               ERR-PROPOSAL-EXECUTED)
    (asserts! (> block-height (get vote-until proposal))              ERR-VOTE-CLOSED)
    (asserts! (>= block-height (get execute-after proposal))          ERR-TIMELOCK-ACTIVE)
    (asserts! (>= yes-bps supermaj)                                   ERR-QUORUM-NOT-MET)
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal { status: STATUS-EXECUTED, executed-at: block-height }))
    (ok true)
  )
)

;; ─── Veto (proposer can cancel before vote closes) ───────────────────────────
(define-public (veto (proposal-id uint))
  (let (
    (caller   tx-sender)
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id })
               ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (is-eq caller (get proposer proposal)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status proposal) STATUS-OPEN) ERR-PROPOSAL-EXECUTED)
    (asserts! (<= block-height (get vote-until proposal)) ERR-VETO-EXPIRED)
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal { status: STATUS-VETOED }))
    (ok true)
  )
)

;; ─── Read-only ───────────────────────────────────────────────────────────────
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote-record (proposal-id uint) (voter principal))
  (map-get? gov-votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-total-proposals) (ok (var-get proposal-nonce)))

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)
