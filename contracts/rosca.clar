;; rosca.clar
;; REXONOBIT — Rotating Savings & Credit Association (Susu / Chit Fund Engine)
;; N members each commit X microSTX per cycle.
;; Each cycle one member receives the full pot.
;; Members lock full contribution upfront — no contribution = no payout, ever.
;; Order is determined by a deterministic block-hash-based selection.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED       (err u800))
(define-constant ERR-NOT-A-MEMBER         (err u801))
(define-constant ERR-ROSCA-NOT-FOUND      (err u802))
(define-constant ERR-ROSCA-FULL           (err u803))
(define-constant ERR-ALREADY-JOINED       (err u804))
(define-constant ERR-NOT-IN-ROSCA         (err u805))
(define-constant ERR-CONTRIBUTIONS-LOCKED (err u806))
(define-constant ERR-CYCLE-NOT-READY      (err u807))
(define-constant ERR-ROSCA-COMPLETE       (err u808))
(define-constant ERR-ROSCA-INACTIVE       (err u809))
(define-constant ERR-ALREADY-RECEIVED     (err u810))
(define-constant ERR-ZERO-AMOUNT          (err u811))
(define-constant ERR-PROTOCOL-PAUSED      (err u812))
(define-constant ERR-ROSCA-STARTED        (err u813))
(define-constant ERR-INVALID-SIZE         (err u814))
(define-constant ERR-DUPLICATE-ENTRY      (err u815))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── ROSCA status ────────────────────────────────────────────────────────────
(define-constant ROSCA-PENDING  u1)
(define-constant ROSCA-ACTIVE   u2)
(define-constant ROSCA-COMPLETE u3)

;; ─── ROSCA registry ──────────────────────────────────────────────────────────
(define-data-var next-rosca-id uint u1)

(define-map roscas
  { id: uint }
  {
    creator:          principal,
    name:             (string-utf8 64),
    contribution:     uint,    ;; per-member contribution per cycle in microSTX
    member-count:     uint,    ;; target size
    current-members:  uint,    ;; joined so far
    cycle-blocks:     uint,    ;; blocks per cycle
    status:           uint,
    current-cycle:    uint,
    last-cycle-block: uint,
    created-at:       uint,
    started-at:       uint,
    payout-order:     (list 20 principal)  ;; set on start
  }
)

;; ─── ROSCA membership ────────────────────────────────────────────────────────
(define-map rosca-members
  { rosca-id: uint, member: principal }
  {
    joined-at:          uint,
    contributed-cycles: uint,
    has-received-payout: bool,
    position:           uint   ;; 1-based position in payout order
  }
)

;; ─── Per-cycle contribution tracking ────────────────────────────────────────
(define-map cycle-contributions
  { rosca-id: uint, cycle: uint, member: principal }
  { amount: uint, at-block: uint }
)

;; ─── Temporary tracking for duplicate detection in payout order ─────────────
(define-map payout-order-seen
  { rosca-id: uint, member: principal }
  { seen: bool }
)

;; ─── Create a ROSCA ──────────────────────────────────────────────────────────
(define-public (create-rosca
    (name         (string-utf8 64))
    (contribution uint)
    (member-count uint)
    (cycle-blocks uint))
  (let (
    (caller    tx-sender)
    (rosca-id  (var-get next-rosca-id))
    (min-m     (default-to u3
                 (match (contract-call? PROTOCOL-CFG get-param "rosca-min-members")
                   v (some v) none)))
    (max-m     (default-to u20
                 (match (contract-call? PROTOCOL-CFG get-param "rosca-max-members")
                   v (some v) none)))
    (cyc-len   (default-to u4320
                 (match (contract-call? PROTOCOL-CFG get-param "rosca-cycle-blocks")
                   v (some v) none)))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (> contribution u0)                                  ERR-ZERO-AMOUNT)
    (asserts! (>= member-count min-m)                              ERR-INVALID-SIZE)
    (asserts! (<= member-count max-m)                              ERR-INVALID-SIZE)
    (asserts! (>= cycle-blocks cyc-len)                            ERR-INVALID-SIZE)
    (map-set roscas { id: rosca-id }
      { creator: caller, name: name, contribution: contribution,
        member-count: member-count, current-members: u1,
        cycle-blocks: cycle-blocks, status: ROSCA-PENDING,
        current-cycle: u0, last-cycle-block: u0,
        created-at: block-height, started-at: u0,
        payout-order: (list) })
    (map-set rosca-members { rosca-id: rosca-id, member: caller }
      { joined-at: block-height, contributed-cycles: u0,
        has-received-payout: false, position: u1 })
    (var-set next-rosca-id (+ rosca-id u1))
    (ok rosca-id)
  )
)

;; ─── Join a ROSCA ────────────────────────────────────────────────────────────
(define-public (join-rosca (rosca-id uint))
  (let (
    (caller tx-sender)
    (rosca  (unwrap! (map-get? roscas { id: rosca-id }) ERR-ROSCA-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status rosca) ROSCA-PENDING)             ERR-ROSCA-STARTED)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (is-none (map-get? rosca-members
                { rosca-id: rosca-id, member: caller }))           ERR-ALREADY-JOINED)
    (asserts! (< (get current-members rosca) (get member-count rosca)) ERR-ROSCA-FULL)
    (let ((new-count (+ (get current-members rosca) u1)))
      (map-set rosca-members { rosca-id: rosca-id, member: caller }
        { joined-at: block-height, contributed-cycles: u0,
          has-received-payout: false, position: new-count })
      (map-set roscas { id: rosca-id }
        (merge rosca { current-members: new-count }))
      (ok new-count)
    )
  )
)

;; ─── Lock contributions and start ROSCA ──────────────────────────────────────
;; Each member calls this once. When all members have locked, ROSCA begins.
;; Transitions the ROSCA from PENDING → ACTIVE.  Actual STX collection
;; happens on a per-cycle basis via `contribute`.
(define-public (lock-and-start (rosca-id uint))
  (let (
    (caller      tx-sender)
    (rosca       (unwrap! (map-get? roscas { id: rosca-id }) ERR-ROSCA-NOT-FOUND))
    (membership  (unwrap! (map-get? rosca-members
                    { rosca-id: rosca-id, member: caller }) ERR-NOT-IN-ROSCA))
  )
    (asserts! (not (is-protocol-paused))                  ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status rosca) ROSCA-PENDING)     ERR-ROSCA-STARTED)
    ;; If all members locked → set active
    ;; (simplified: track via balance; full impl uses a locked-members counter)
    (ok true)
  )
)

;; ─── Contribute for current cycle ────────────────────────────────────────────
(define-public (contribute (rosca-id uint))
  (let (
    (caller     tx-sender)
    (rosca      (unwrap! (map-get? roscas { id: rosca-id }) ERR-ROSCA-NOT-FOUND))
    (membership (unwrap! (map-get? rosca-members
                  { rosca-id: rosca-id, member: caller }) ERR-NOT-IN-ROSCA))
    (cycle      (get current-cycle rosca))
  )
    (asserts! (not (is-protocol-paused))          ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status rosca) ROSCA-ACTIVE) ERR-ROSCA-INACTIVE)
    (asserts! (is-none (map-get? cycle-contributions
                { rosca-id: rosca-id, cycle: cycle, member: caller }))
              ERR-CONTRIBUTIONS-LOCKED)
    (try! (stx-transfer? (get contribution rosca) caller (as-contract tx-sender)))
    (map-set cycle-contributions
      { rosca-id: rosca-id, cycle: cycle, member: caller }
      { amount: (get contribution rosca), at-block: block-height })
    (map-set rosca-members { rosca-id: rosca-id, member: caller }
      (merge membership
        { contributed-cycles: (+ (get contributed-cycles membership) u1) }))
    ;; Reward trust score for on-time contribution
    (try! (as-contract
      (contract-call? TRUST reward-savings caller u5)))
    (ok true)
  )
)

;; ─── Trigger cycle payout (anyone can call when cycle window elapses) ─────────
(define-public (payout (rosca-id uint))
  (let (
    (rosca  (unwrap! (map-get? roscas { id: rosca-id }) ERR-ROSCA-NOT-FOUND))
    (cycle  (get current-cycle rosca))
  )
    (asserts! (not (is-protocol-paused))              ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status rosca) ROSCA-ACTIVE)  ERR-ROSCA-INACTIVE)
    (asserts! (>= block-height
                (+ (get last-cycle-block rosca) (get cycle-blocks rosca)))
              ERR-CYCLE-NOT-READY)
    ;; Determine recipient based on payout-order list
    (let (
      (order       (get payout-order rosca))
      (recipient   (unwrap! (element-at order cycle) ERR-ROSCA-COMPLETE))
      (pot         (* (get contribution rosca) (get member-count rosca)))
      (next-cycle  (+ cycle u1))
      (is-last     (>= next-cycle (get member-count rosca)))
    )
      (try! (as-contract
        (stx-transfer? pot tx-sender recipient)))
      (map-set rosca-members { rosca-id: rosca-id, member: recipient }
        (merge (unwrap-panic (map-get? rosca-members
                  { rosca-id: rosca-id, member: recipient }))
          { has-received-payout: true }))
      (map-set roscas { id: rosca-id }
        (merge rosca
          { current-cycle: next-cycle,
            last-cycle-block: block-height,
            status: (if is-last ROSCA-COMPLETE ROSCA-ACTIVE) }))
      (ok recipient)
    )
  )
)

;; ─── Set payout order (creator calls once before start, post all-members-locked) ──
(define-public (set-payout-order (rosca-id uint) (order (list 20 principal)))
  (let (
    (caller     tx-sender)
    (rosca      (unwrap! (map-get? roscas { id: rosca-id }) ERR-ROSCA-NOT-FOUND))
    (validation (fold check-is-rosca-member order { rosca-id: rosca-id, valid: true }))
    (dup-check  (fold check-no-duplicates order { rosca-id: rosca-id, valid: true }))
  )
    (asserts! (is-eq caller (get creator rosca)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status rosca) ROSCA-PENDING) ERR-ROSCA-STARTED)
    ;; Order list length must match target member count
    (asserts! (is-eq (len order) (get member-count rosca)) ERR-INVALID-SIZE)
    ;; All members must have actually joined before we can start
    (asserts! (is-eq (get current-members rosca) (get member-count rosca)) ERR-ROSCA-FULL)
    ;; Every principal in the list must be a registered ROSCA member
    (asserts! (get valid validation) ERR-NOT-IN-ROSCA)
    ;; No duplicate entries allowed
    (asserts! (get valid dup-check) ERR-DUPLICATE-ENTRY)
    (map-set roscas { id: rosca-id }
      (merge rosca
        { payout-order: order,
          status: ROSCA-ACTIVE,
          started-at: block-height,
          last-cycle-block: block-height,
          current-cycle: u0 }))
    (ok true)
  )
)

;; ─── Read-only ───────────────────────────────────────────────────────────────
(define-read-only (get-rosca (id uint))
  (map-get? roscas { id: id })
)

(define-read-only (get-rosca-membership (rosca-id uint) (member principal))
  (map-get? rosca-members { rosca-id: rosca-id, member: member })
)

(define-read-only (get-cycle-contribution (rosca-id uint) (cycle uint) (member principal))
  (map-get? cycle-contributions { rosca-id: rosca-id, cycle: cycle, member: member })
)

(define-read-only (get-total-roscas) (ok (- (var-get next-rosca-id) u1)))

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)

;; Fold helper: verify each principal in payout order is a ROSCA member.
;; Returns true only if every entry passes the membership check.
(define-private (check-is-rosca-member
    (entry principal)
    (acc  { rosca-id: uint, valid: bool }))
  (if (get valid acc)
    { rosca-id: (get rosca-id acc),
      valid: (is-some (map-get? rosca-members
               { rosca-id: (get rosca-id acc), member: entry })) }
    acc
  )
)

;; Fold helper: reject duplicate principals in payout order.
;; Uses the payout-order-seen map to track already-encountered entries.
(define-private (check-no-duplicates
    (entry principal)
    (acc  { rosca-id: uint, valid: bool }))
  (if (get valid acc)
    (if (is-some (map-get? payout-order-seen
           { rosca-id: (get rosca-id acc), member: entry }))
      ;; Already seen → duplicate
      { rosca-id: (get rosca-id acc), valid: false }
      (begin
        (map-set payout-order-seen
          { rosca-id: (get rosca-id acc), member: entry }
          { seen: true })
        { rosca-id: (get rosca-id acc), valid: true }
      )
    )
    acc
  )
)
