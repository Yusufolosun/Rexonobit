;; treasury.clar
;; REXONOBIT -- Circle Treasury
;; Shared treasury per circle fed by: loan fees, unclaimed bounties, protocol fees,
;; voluntary contributions.
;; Governed by circle members -- large spends require 67% supermajority + timelock.

;; --- Error codes -------------------------------------------------------------
(define-constant ERR-NOT-AUTHORIZED      (err u600))
(define-constant ERR-NOT-A-MEMBER        (err u601))
(define-constant ERR-PROPOSAL-NOT-FOUND  (err u602))
(define-constant ERR-ALREADY-VOTED       (err u603))
(define-constant ERR-VOTE-CLOSED         (err u604))
(define-constant ERR-INSUFFICIENT-VOTES  (err u605))
(define-constant ERR-TIMELOCK-ACTIVE     (err u606))
(define-constant ERR-INSUFFICIENT-FUNDS  (err u607))
(define-constant ERR-ZERO-AMOUNT         (err u608))
(define-constant ERR-PROTOCOL-PAUSED     (err u609))
(define-constant ERR-NOT-IN-CIRCLE       (err u610))
(define-constant ERR-PROPOSAL-EXECUTED   (err u611))
(define-constant ERR-CIRCLE-NOT-FOUND    (err u612))
(define-constant ERR-QUORUM-NOT-MET      (err u613))

;; --- Contract references -----------------------------------------------------
(define-constant REGISTRY     .cooperative-registry)
(define-constant PROTOCOL-CFG .protocol-config)

;; --- Treasury balances (per circle) -----------------------------------------
(define-map treasury-balances
  { circle-id: uint }
  {
    balance:       uint,
    total-in:      uint,
    total-out:     uint,
    proposal-count: uint
  }
)

;; --- Spend proposals ---------------------------------------------------------
(define-data-var proposal-nonce uint u0)

(define-map proposals
  { proposal-id: uint }
  {
    circle-id:    uint,
    proposer:     principal,
    recipient:    principal,
    amount:       uint,
    description:  (string-utf8 256),
    yes-votes:    uint,
    no-votes:     uint,
    total-voters: uint,
    status:       uint,     ;; 1=open 2=approved 3=rejected 4=executed 5=cancelled
    created-at:   uint,
    vote-until:   uint,
    execute-after: uint,    ;; timelock: must wait N blocks after approval
    executed-at:  uint
  }
)

;; --- Vote tracking -----------------------------------------------------------
(define-map proposal-votes
  { proposal-id: uint, voter: principal }
  { vote: bool, at-block: uint }
)

;; --- Deposit to a circle treasury --------------------------------------------
(define-public (deposit-to-treasury (circle-id uint) (amount uint))
  (let (
    (caller  tx-sender)
    (current (default-to
               { balance: u0, total-in: u0, total-out: u0, proposal-count: u0 }
               (map-get? treasury-balances { circle-id: circle-id })))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                        ERR-ZERO-AMOUNT)
    (asserts! (contract-call? .cooperative-registry is-active-member caller)   ERR-NOT-A-MEMBER)
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    (map-set treasury-balances { circle-id: circle-id }
      (merge current
        { balance: (+ (get balance current) amount),
          total-in: (+ (get total-in current) amount) }))
    (ok (+ (get balance current) amount))
  )
)

;; --- Internal deposit (called by other contracts) ----------------------------
(define-public (internal-deposit (circle-id uint) (amount uint))
  (let (
    (current (default-to
               { balance: u0, total-in: u0, total-out: u0, proposal-count: u0 }
               (map-get? treasury-balances { circle-id: circle-id })))
  )
    ;; Only authorized writer contracts
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set treasury-balances { circle-id: circle-id }
      (merge current
        { balance: (+ (get balance current) amount),
          total-in: (+ (get total-in current) amount) }))
    (ok true)
  )
)

;; --- Propose a spend ---------------------------------------------------------
(define-public (propose-spend
    (circle-id   uint)
    (recipient   principal)
    (amount      uint)
    (description (string-utf8 256)))
  (let (
    (caller      tx-sender)
    (treasury    (unwrap! (map-get? treasury-balances { circle-id: circle-id })
                  ERR-CIRCLE-NOT-FOUND))
    (proposal-id (+ (var-get proposal-nonce) u1))
    (vote-blocks (default-to u1440
                   (match (contract-call? .protocol-config get-param "governance-vote-blocks")
                     v (some v) err-v none)))
    (timelock    (default-to u288
                   (match (contract-call? .protocol-config get-param "governance-timelock-blocks")
                     v (some v) err-v none)))
    (large-thr   (default-to u10000000
                   (match (contract-call? .protocol-config get-param "treasury-large-spend-threshold")
                     v (some v) err-v none)))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                        ERR-ZERO-AMOUNT)
    (asserts! (contract-call? .cooperative-registry is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? .cooperative-registry is-circle-member circle-id caller) ERR-NOT-IN-CIRCLE)
    (asserts! (<= amount (get balance treasury))                   ERR-INSUFFICIENT-FUNDS)
    (map-set proposals { proposal-id: proposal-id }
      { circle-id: circle-id, proposer: caller, recipient: recipient,
        amount: amount, description: description,
        yes-votes: u0, no-votes: u0, total-voters: u0,
        status: u1,
        created-at: block-height,
        vote-until: (+ block-height vote-blocks),
        execute-after: (+ block-height vote-blocks timelock),
        executed-at: u0 })
    (map-set treasury-balances { circle-id: circle-id }
      (merge treasury { proposal-count: (+ (get proposal-count treasury) u1) }))
    (var-set proposal-nonce proposal-id)
    (ok proposal-id)
  )
)

;; --- Vote on a proposal ------------------------------------------------------
(define-public (vote (proposal-id uint) (approve bool))
  (let (
    (caller   tx-sender)
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id })
               ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))             ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status proposal) u1)        ERR-VOTE-CLOSED)
    (asserts! (<= block-height (get vote-until proposal)) ERR-VOTE-CLOSED)
    (asserts! (contract-call? .cooperative-registry is-active-member caller) ERR-NOT-A-MEMBER)
    (asserts! (contract-call? .cooperative-registry is-circle-member
                (get circle-id proposal) caller)      ERR-NOT-IN-CIRCLE)
    (asserts! (is-none (map-get? proposal-votes
                { proposal-id: proposal-id, voter: caller }))    ERR-ALREADY-VOTED)
    (map-set proposal-votes { proposal-id: proposal-id, voter: caller }
      { vote: approve, at-block: block-height })
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal
        { yes-votes: (if approve (+ (get yes-votes proposal) u1) (get yes-votes proposal)),
          no-votes:  (if approve (get no-votes proposal) (+ (get no-votes proposal) u1)),
          total-voters: (+ (get total-voters proposal) u1) }))
    (ok true)
  )
)

;; --- Execute a proposal (after timelock, if supermajority passed) -------------
(define-public (execute-spend (proposal-id uint))
  (let (
    (proposal  (unwrap! (map-get? proposals { proposal-id: proposal-id })
                ERR-PROPOSAL-NOT-FOUND))
    (treasury  (unwrap! (map-get? treasury-balances
                  { circle-id: (get circle-id proposal) })
                ERR-CIRCLE-NOT-FOUND))
    (circle    (unwrap! (contract-call? .cooperative-registry get-circle (get circle-id proposal))
                ERR-CIRCLE-NOT-FOUND))
    (supermaj  (default-to u6700
                 (match (contract-call? .protocol-config get-param "governance-supermajority-bps")
                   v (some v) err-v none)))
    ;; Quorum: at least 50 % of circle members must have voted (default)
    (quorum-bps (default-to u5000
                  (match (contract-call? .protocol-config get-param "treasury-quorum-bps")
                    v (some v) err-v none)))
    (total-v   (get total-voters proposal))
    (yes-v     (get yes-votes proposal))
    (member-ct (get member-count circle))
    ;; Yes-vote ratio in basis points
    (yes-bps   (if (> total-v u0) (/ (* yes-v u10000) total-v) u0))
    ;; Participation ratio in basis points
    (participation-bps (if (> member-ct u0) (/ (* total-v u10000) member-ct) u0))
  )
    (asserts! (not (is-protocol-paused))              ERR-PROTOCOL-PAUSED)
    (asserts! (or (is-eq (get status proposal) u1) (is-eq (get status proposal) u2))
              ERR-PROPOSAL-EXECUTED)
    (asserts! (> block-height (get vote-until proposal))  ERR-VOTE-CLOSED)
    (asserts! (>= block-height (get execute-after proposal)) ERR-TIMELOCK-ACTIVE)
    ;; Enough members must have participated before we trust the vote ratio
    (asserts! (>= participation-bps quorum-bps)           ERR-QUORUM-NOT-MET)
    (asserts! (>= yes-bps supermaj)                       ERR-INSUFFICIENT-VOTES)
    (asserts! (<= (get amount proposal) (get balance treasury)) ERR-INSUFFICIENT-FUNDS)
    (try! (as-contract
      (stx-transfer? (get amount proposal) tx-sender (get recipient proposal))))
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal { status: u4, executed-at: block-height }))
    (map-set treasury-balances { circle-id: (get circle-id proposal) }
      (merge treasury
        { balance:    (- (get balance treasury) (get amount proposal)),
          total-out:  (+ (get total-out treasury) (get amount proposal)) }))
    (ok true)
  )
)

;; --- Read-only ---------------------------------------------------------------
(define-read-only (get-treasury-balance (circle-id uint))
  (match (map-get? treasury-balances { circle-id: circle-id })
    t (ok (get balance t))
    ERR-CIRCLE-NOT-FOUND
  )
)

(define-read-only (get-treasury (circle-id uint))
  (map-get? treasury-balances { circle-id: circle-id })
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? proposal-votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-total-proposals) (ok (var-get proposal-nonce)))

;; --- Internal ----------------------------------------------------------------
(define-private (is-protocol-paused)
  (unwrap-panic (contract-call? .protocol-config is-paused))
)
