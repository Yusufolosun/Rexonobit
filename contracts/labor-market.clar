;; labor-market.clar
;; REXONOBIT — On-Chain Gig Board
;; Members post tasks with STX bounties. Others bid and complete them.
;; Completion requires 2-of-3: poster + 1 neutral circle member.
;; Disputes escalate to arbitration.clar.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u500))
(define-constant ERR-NOT-A-MEMBER        (err u501))
(define-constant ERR-TASK-NOT-FOUND      (err u502))
(define-constant ERR-TASK-NOT-OPEN       (err u503))
(define-constant ERR-TASK-NOT-ASSIGNED   (err u504))
(define-constant ERR-ALREADY-BID         (err u505))
(define-constant ERR-NOT-BIDDER          (err u506))
(define-constant ERR-SELF-BID            (err u507))
(define-constant ERR-ZERO-BOUNTY         (err u508))
(define-constant ERR-DISPUTE-EXISTS      (err u509))
(define-constant ERR-NOT-ATTESTOR        (err u510))
(define-constant ERR-ALREADY-ATTESTED    (err u511))
(define-constant ERR-INSUFFICIENT-ATTEST (err u512))
(define-constant ERR-PROTOCOL-PAUSED     (err u513))
(define-constant ERR-NOT-IN-CIRCLE       (err u514))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)
(define-constant ARBITRATION  .arbitration)

;; ─── Task status ─────────────────────────────────────────────────────────────
(define-constant TASK-OPEN       u1)
(define-constant TASK-ASSIGNED   u2)
(define-constant TASK-REVIEW     u3)   ;; worker submitted, awaiting attestation
(define-constant TASK-COMPLETE   u4)
(define-constant TASK-DISPUTED   u5)
(define-constant TASK-CANCELLED  u6)

;; ─── Task records ────────────────────────────────────────────────────────────
(define-data-var task-nonce uint u0)

(define-map tasks
  { task-id: uint }
  {
    poster:        principal,
    circle-id:     uint,
    title:         (string-utf8 128),
    description:   (string-utf8 512),
    bounty:        uint,
    status:        uint,
    worker:        (optional principal),
    created-at:    uint,
    assigned-at:   uint,
    completed-at:  uint,
    dispute-id:    uint   ;; 0 = no dispute
  }
)

;; ─── Bids ────────────────────────────────────────────────────────────────────
(define-map bids
  { task-id: uint, bidder: principal }
  { proposed-at: uint, message: (string-utf8 256) }
)

;; ─── Completion attestations (poster + neutral = 2-of-2 minimum) ─────────────
(define-map attestations
  { task-id: uint, attestor: principal }
  { attested-at: uint, approved: bool }
)

(define-map task-attest-count
  { task-id: uint }
  { approvals: uint, rejections: uint }
)

;; ─── Post a task ─────────────────────────────────────────────────────────────
(define-public (post-task
    (circle-id   uint)
    (title       (string-utf8 128))
    (description (string-utf8 512))
    (bounty      uint))
  (let (
    (caller  tx-sender)
    (task-id (+ (var-get task-nonce) u1))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (> bounty u0)                                        ERR-ZERO-BOUNTY)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? REGISTRY is-circle-member circle-id caller) ERR-NOT-IN-CIRCLE)
    ;; Lock bounty in contract
    (try! (stx-transfer? bounty caller (as-contract tx-sender)))
    (map-set tasks { task-id: task-id }
      { poster: caller, circle-id: circle-id,
        title: title, description: description, bounty: bounty,
        status: TASK-OPEN, worker: none,
        created-at: block-height, assigned-at: u0,
        completed-at: u0, dispute-id: u0 })
    (map-set task-attest-count { task-id: task-id }
      { approvals: u0, rejections: u0 })
    (var-set task-nonce task-id)
    (ok task-id)
  )
)

;; ─── Bid on a task ───────────────────────────────────────────────────────────
(define-public (bid-task (task-id uint) (message (string-utf8 256)))
  (let (
    (caller tx-sender)
    (task   (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status task) TASK-OPEN)                  ERR-TASK-NOT-OPEN)
    (asserts! (not (is-eq caller (get poster task)))               ERR-SELF-BID)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (is-none (map-get? bids { task-id: task-id, bidder: caller }))
              ERR-ALREADY-BID)
    (map-set bids { task-id: task-id, bidder: caller }
      { proposed-at: block-height, message: message })
    (ok true)
  )
)

;; ─── Accept a bid (poster assigns worker) ────────────────────────────────────
(define-public (accept-bid (task-id uint) (worker principal))
  (let (
    (caller tx-sender)
    (task   (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))         ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq caller (get poster task))    ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status task) TASK-OPEN) ERR-TASK-NOT-OPEN)
    (asserts! (is-some (map-get? bids { task-id: task-id, bidder: worker }))
              ERR-NOT-BIDDER)
    (map-set tasks { task-id: task-id }
      (merge task
        { status: TASK-ASSIGNED, worker: (some worker),
          assigned-at: block-height }))
    (ok true)
  )
)

;; ─── Worker submits completion ────────────────────────────────────────────────
(define-public (submit-completion (task-id uint))
  (let (
    (caller tx-sender)
    (task   (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))              ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status task) TASK-ASSIGNED)  ERR-TASK-NOT-ASSIGNED)
    (asserts! (is-eq (some caller) (get worker task))  ERR-NOT-AUTHORIZED)
    (map-set tasks { task-id: task-id }
      (merge task { status: TASK-REVIEW }))
    (ok true)
  )
)

;; ─── Attest completion (poster or neutral circle member) ─────────────────────
(define-public (attest (task-id uint) (approved bool))
  (let (
    (caller  tx-sender)
    (task    (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
    (counts  (unwrap! (map-get? task-attest-count { task-id: task-id })
               ERR-TASK-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))                           ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status task) TASK-REVIEW)                 ERR-TASK-NOT-ASSIGNED)
    (asserts! (is-none (map-get? attestations { task-id: task-id, attestor: caller }))
              ERR-ALREADY-ATTESTED)
    ;; Attestor must be poster OR circle member (not the worker)
    (asserts!
      (or (is-eq caller (get poster task))
          (contract-call? REGISTRY is-circle-member (get circle-id task) caller))
      ERR-NOT-ATTESTOR)
    (asserts! (not (is-eq (some caller) (get worker task)))         ERR-NOT-AUTHORIZED)
    (map-set attestations { task-id: task-id, attestor: caller }
      { attested-at: block-height, approved: approved })
    (let (
      (new-approvals  (if approved (+ (get approvals counts) u1) (get approvals counts)))
      (new-rejections (if approved (get rejections counts) (+ (get rejections counts) u1)))
    )
      (map-set task-attest-count { task-id: task-id }
        { approvals: new-approvals, rejections: new-rejections })
      ;; 2 approvals → release payment
      (if (>= new-approvals u2)
        (release-payment task-id task)
        ;; 2 rejections → re-open for worker to resubmit
        (if (>= new-rejections u2)
          (begin
            (map-set tasks { task-id: task-id }
              (merge task { status: TASK-ASSIGNED }))
            (ok false)
          )
          (ok false)
        )
      )
    )
  )
)

;; ─── Internal: release payment to worker ─────────────────────────────────────
(define-private (release-payment (task-id uint) (task { poster: principal, circle-id: uint, title: (string-utf8 128), description: (string-utf8 512), bounty: uint, status: uint, worker: (optional principal), created-at: uint, assigned-at: uint, completed-at: uint, dispute-id: uint }))
  (let ((worker (unwrap! (get worker task) ERR-TASK-NOT-ASSIGNED)))
    (try! (as-contract (stx-transfer? (get bounty task) tx-sender worker)))
    (map-set tasks { task-id: task-id }
      (merge task { status: TASK-COMPLETE, completed-at: block-height }))
    ;; Reward trust score for completing a task
    (try! (as-contract (contract-call? TRUST reward-labor worker u15)))
    (ok true)
  )
)

;; ─── Dispute a task ──────────────────────────────────────────────────────────
(define-public (dispute-task
    (task-id  uint)
    (reason   (string-utf8 512))
    (evidence (string-utf8 512)))
  (let (
    (caller tx-sender)
    (task   (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
    (poster (get poster task))
    (worker (unwrap! (get worker task) ERR-TASK-NOT-ASSIGNED))
    ;; If the caller is the poster, the respondent is the worker; vice-versa
    (respondent (if (is-eq caller poster) worker poster))
  )
    (asserts! (not (is-protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts!
      (or (is-eq caller poster) (is-eq caller worker))
      ERR-NOT-AUTHORIZED)
    (asserts!
      (or (is-eq (get status task) TASK-REVIEW)
          (is-eq (get status task) TASK-ASSIGNED))
      ERR-TASK-NOT-ASSIGNED)
    ;; Open a dispute in the arbitration contract (caller pays the arb fee)
    (let (
      (dispute-id (try! (contract-call? ARBITRATION open-dispute
                          respondent (get circle-id task) reason evidence)))
    )
      (map-set tasks { task-id: task-id }
        (merge task { status: TASK-DISPUTED, dispute-id: dispute-id }))
      (ok dispute-id)
    )
  )
)

;; ─── Cancel a task (poster only, while open) ─────────────────────────────────
(define-public (cancel-task (task-id uint))
  (let (
    (caller tx-sender)
    (task   (unwrap! (map-get? tasks { task-id: task-id }) ERR-TASK-NOT-FOUND))
  )
    (asserts! (is-eq caller (get poster task))    ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status task) TASK-OPEN)  ERR-TASK-NOT-OPEN)
    ;; Refund bounty to poster
    (try! (as-contract (stx-transfer? (get bounty task) tx-sender caller)))
    (map-set tasks { task-id: task-id }
      (merge task { status: TASK-CANCELLED }))
    (ok true)
  )
)

;; ─── Read-only ───────────────────────────────────────────────────────────────
(define-read-only (get-task (task-id uint))
  (map-get? tasks { task-id: task-id })
)

(define-read-only (get-bid (task-id uint) (bidder principal))
  (map-get? bids { task-id: task-id, bidder: bidder })
)

(define-read-only (get-attestation (task-id uint) (attestor principal))
  (map-get? attestations { task-id: task-id, attestor: attestor })
)

(define-read-only (get-attest-counts (task-id uint))
  (map-get? task-attest-count { task-id: task-id })
)

(define-read-only (get-total-tasks) (ok (var-get task-nonce)))

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)
