;; cooperative-registry.clar
;; REXONOBIT — Membership Engine
;; Manages member onboarding, cooperative circles (5-50 people),
;; social vouching (2-of-N endorsement), and member status lifecycle.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED       (err u100))
(define-constant ERR-ALREADY-MEMBER       (err u101))
(define-constant ERR-NOT-A-MEMBER         (err u102))
(define-constant ERR-CIRCLE-NOT-FOUND     (err u103))
(define-constant ERR-CIRCLE-FULL          (err u104))
(define-constant ERR-ALREADY-IN-CIRCLE    (err u105))
(define-constant ERR-NOT-IN-CIRCLE        (err u106))
(define-constant ERR-INSUFFICIENT-VOUCHES (err u107))
(define-constant ERR-ALREADY-VOUCHED      (err u108))
(define-constant ERR-SELF-VOUCH           (err u109))
(define-constant ERR-MEMBER-SUSPENDED     (err u110))
(define-constant ERR-CIRCLE-EXISTS        (err u111))
(define-constant ERR-PENDING-NOT-FOUND    (err u112))
(define-constant ERR-PROTOCOL-PAUSED      (err u113))
(define-constant ERR-INVALID-NAME         (err u114))
(define-constant ERR-CIRCLE-INACTIVE      (err u115))

;; ─── Protocol config reference ───────────────────────────────────────────────
(define-constant PROTOCOL-CONFIG .protocol-config)

;; ─── Member status values ────────────────────────────────────────────────────
(define-constant STATUS-ACTIVE    u1)
(define-constant STATUS-SUSPENDED u2)
(define-constant STATUS-EXPELLED  u3)
(define-constant STATUS-PENDING   u4)

;; ─── Global counters ─────────────────────────────────────────────────────────
(define-data-var next-circle-id    uint u1)
(define-data-var total-members     uint u0)
(define-data-var total-circles     uint u0)

;; ─── Member registry ─────────────────────────────────────────────────────────
(define-map members
  { address: principal }
  {
    status:         uint,
    joined-at:      uint,
    circle-count:   uint,
    total-vouches:  uint,
    display-name:   (string-utf8 64)
  }
)

;; ─── Circle registry ─────────────────────────────────────────────────────────
(define-map circles
  { id: uint }
  {
    name:          (string-utf8 64),
    founder:       principal,
    member-count:  uint,
    created-at:    uint,
    is-open:       bool,
    is-active:     bool,
    min-deposit:   uint,
    description:   (string-utf8 256)
  }
)

;; ─── Circle membership ───────────────────────────────────────────────────────
(define-map circle-members
  { circle-id: uint, member: principal }
  { joined-at: uint, role: uint }   ;; role: 1=member 2=admin
)

;; ─── Pending join requests ───────────────────────────────────────────────────
(define-map pending-joins
  { circle-id: uint, applicant: principal }
  { requested-at: uint, vouch-count: uint }
)

;; ─── Vouch tracking (prevents double-vouch) ──────────────────────────────────
(define-map vouches
  { circle-id: uint, applicant: principal, voucher: principal }
  { at-block: uint }
)

;; ─── Register as a global protocol member ────────────────────────────────────
(define-public (register-member (display-name (string-utf8 64)))
  (let ((caller tx-sender))
    (asserts! (not (is-protocol-paused))          ERR-PROTOCOL-PAUSED)
    (asserts! (is-none (map-get? members { address: caller })) ERR-ALREADY-MEMBER)
    (asserts! (> (len display-name) u0)            ERR-INVALID-NAME)
    (map-set members { address: caller }
      { status: STATUS-ACTIVE,
        joined-at: block-height,
        circle-count: u0,
        total-vouches: u0,
        display-name: display-name })
    (var-set total-members (+ (var-get total-members) u1))
    (ok true)
  )
)

;; ─── Create a circle ─────────────────────────────────────────────────────────
(define-public (create-circle
    (name        (string-utf8 64))
    (description (string-utf8 256))
    (is-open     bool)
    (min-deposit uint))
  (let (
    (caller    tx-sender)
    (circle-id (var-get next-circle-id))
  )
    (asserts! (not (is-protocol-paused))          ERR-PROTOCOL-PAUSED)
    (asserts! (is-active-member caller)            ERR-NOT-A-MEMBER)
    (asserts! (> (len name) u0)                    ERR-INVALID-NAME)
    (map-set circles { id: circle-id }
      { name: name,
        founder: caller,
        member-count: u1,
        created-at: block-height,
        is-open: is-open,
        is-active: true,
        min-deposit: min-deposit,
        description: description })
    ;; Founder is automatically an admin member
    (map-set circle-members { circle-id: circle-id, member: caller }
      { joined-at: block-height, role: u2 })
    ;; Increment founder's circle count
    (map-set members { address: caller }
      (merge (unwrap-panic (map-get? members { address: caller }))
        { circle-count: (+ (get circle-count
            (unwrap-panic (map-get? members { address: caller }))) u1) }))
    (var-set next-circle-id  (+ circle-id u1))
    (var-set total-circles   (+ (var-get total-circles) u1))
    (ok circle-id)
  )
)

;; ─── Request to join a circle (goes to pending if not open) ──────────────────
(define-public (request-join (circle-id uint))
  (let (
    (caller  tx-sender)
    (circle  (unwrap! (map-get? circles { id: circle-id }) ERR-CIRCLE-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))          ERR-PROTOCOL-PAUSED)
    (asserts! (is-active-member caller)            ERR-NOT-A-MEMBER)
    (asserts! (get is-active circle)               ERR-CIRCLE-INACTIVE)
    (asserts! (is-none (map-get? circle-members { circle-id: circle-id, member: caller }))
              ERR-ALREADY-IN-CIRCLE)
    (asserts! (is-none (map-get? pending-joins { circle-id: circle-id, applicant: caller }))
              ERR-ALREADY-IN-CIRCLE)
    (let ((max-members (default-to u50
            (match (contract-call? PROTOCOL-CONFIG get-param "circle-max-members")
              v (some v) none))))
      (asserts! (< (get member-count circle) max-members) ERR-CIRCLE-FULL)
    )
    (if (get is-open circle)
      ;; Open circle — join directly
      (begin
        (map-set circle-members { circle-id: circle-id, member: caller }
          { joined-at: block-height, role: u1 })
        (map-set circles { id: circle-id }
          (merge circle { member-count: (+ (get member-count circle) u1) }))
        (map-set members { address: caller }
          (merge (unwrap-panic (map-get? members { address: caller }))
            { circle-count: (+ (get circle-count
                (unwrap-panic (map-get? members { address: caller }))) u1) }))
        (ok true)
      )
      ;; Closed circle — create pending application
      (begin
        (map-set pending-joins { circle-id: circle-id, applicant: caller }
          { requested-at: block-height, vouch-count: u0 })
        (ok false)   ;; false = pending, not yet joined
      )
    )
  )
)

;; ─── Vouch for a pending applicant ───────────────────────────────────────────
(define-public (vouch-for (circle-id uint) (applicant principal))
  (let (
    (caller  tx-sender)
    (circle  (unwrap! (map-get? circles     { id: circle-id })             ERR-CIRCLE-NOT-FOUND))
    (pending (unwrap! (map-get? pending-joins { circle-id: circle-id, applicant: applicant })
              ERR-PENDING-NOT-FOUND))
  )
    (asserts! (not (is-eq caller applicant))        ERR-SELF-VOUCH)
    (asserts! (is-active-member caller)             ERR-NOT-A-MEMBER)
    (asserts! (is-some (map-get? circle-members
                { circle-id: circle-id, member: caller }))  ERR-NOT-IN-CIRCLE)
    (asserts! (is-none (map-get? vouches
                { circle-id: circle-id, applicant: applicant, voucher: caller }))
              ERR-ALREADY-VOUCHED)
    ;; Record vouch
    (map-set vouches { circle-id: circle-id, applicant: applicant, voucher: caller }
      { at-block: block-height })
    ;; Update voucher's total-vouches stat
    (map-set members { address: caller }
      (merge (unwrap-panic (map-get? members { address: caller }))
        { total-vouches: (+ (get total-vouches
            (unwrap-panic (map-get? members { address: caller }))) u1) }))
    (let (
      (new-count (+ (get vouch-count pending) u1))
      (required  (default-to u2
          (match (contract-call? PROTOCOL-CONFIG get-param "endorsement-required-count")
            v (some v) none)))
    )
      (map-set pending-joins { circle-id: circle-id, applicant: applicant }
        (merge pending { vouch-count: new-count }))
      (if (>= new-count required)
        ;; Threshold reached — finalize join
        (begin
          (map-set circle-members { circle-id: circle-id, member: applicant }
            { joined-at: block-height, role: u1 })
          (map-set circles { id: circle-id }
            (merge circle { member-count: (+ (get member-count circle) u1) }))
          (map-set members { address: applicant }
            (merge (unwrap-panic (map-get? members { address: applicant }))
              { circle-count: (+ (get circle-count
                  (unwrap-panic (map-get? members { address: applicant }))) u1) }))
          (map-delete pending-joins { circle-id: circle-id, applicant: applicant })
          (ok true)
        )
        (ok false)   ;; more vouches needed
      )
    )
  )
)

;; ─── Expel a member (circle admin only) ──────────────────────────────────────
(define-public (expel-member (circle-id uint) (target principal))
  (let (
    (caller      tx-sender)
    (caller-role (unwrap! (map-get? circle-members { circle-id: circle-id, member: caller })
                  ERR-NOT-IN-CIRCLE))
    (circle      (unwrap! (map-get? circles { id: circle-id }) ERR-CIRCLE-NOT-FOUND))
  )
    (asserts! (is-eq (get role caller-role) u2) ERR-NOT-AUTHORIZED)
    (asserts! (is-some (map-get? circle-members { circle-id: circle-id, member: target }))
              ERR-NOT-IN-CIRCLE)
    (map-delete circle-members { circle-id: circle-id, member: target })
    (map-set circles { id: circle-id }
      (merge circle { member-count: (- (get member-count circle) u1) }))
    ;; Mark member as expelled globally
    (match (map-get? members { address: target })
      m (map-set members { address: target }
           (merge m { status: STATUS-EXPELLED }))
      false
    )
    (ok true)
  )
)

;; ─── Suspend a member globally (protocol admin) ──────────────────────────────
(define-public (suspend-member (target principal))
  (begin
    (asserts! (is-eq tx-sender
      (unwrap! (contract-call? PROTOCOL-CONFIG get-admin) ERR-NOT-AUTHORIZED))
      ERR-NOT-AUTHORIZED)
    (match (map-get? members { address: target })
      m (begin
          (map-set members { address: target } (merge m { status: STATUS-SUSPENDED }))
          (ok true))
      ERR-NOT-A-MEMBER
    )
  )
)

;; ─── Read-only helpers ───────────────────────────────────────────────────────
(define-read-only (get-member (address principal))
  (map-get? members { address: address })
)

(define-read-only (get-circle (id uint))
  (map-get? circles { id: id })
)

(define-read-only (get-circle-membership (circle-id uint) (member principal))
  (map-get? circle-members { circle-id: circle-id, member: member })
)

(define-read-only (get-pending-join (circle-id uint) (applicant principal))
  (map-get? pending-joins { circle-id: circle-id, applicant: applicant })
)

(define-read-only (get-vouch (circle-id uint) (applicant principal) (voucher principal))
  (map-get? vouches { circle-id: circle-id, applicant: applicant, voucher: voucher })
)

(define-read-only (is-member (address principal))
  (is-some (map-get? members { address: address }))
)

(define-read-only (is-active-member (address principal))
  (match (map-get? members { address: address })
    m (is-eq (get status m) STATUS-ACTIVE)
    false
  )
)

(define-read-only (is-circle-member (circle-id uint) (address principal))
  (is-some (map-get? circle-members { circle-id: circle-id, member: address }))
)

(define-read-only (get-member-status (address principal))
  (match (map-get? members { address: address })
    m (ok (get status m))
    (err u102)
  )
)

(define-read-only (get-total-members)   (ok (var-get total-members)))
(define-read-only (get-total-circles)   (ok (var-get total-circles)))
(define-read-only (get-next-circle-id)  (ok (var-get next-circle-id)))

;; ─── Internal: protocol paused passthrough ───────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CONFIG is-paused)
    v v
    false
  )
)
