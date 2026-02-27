;; lending-pool.clar
;; REXONOBIT — Circle-Backed Micro Lending
;; Members borrow from a shared circle pool.
;; Loan size is capped at trust-score × loan-max-multiplier.
;; A fixed contribution fee (not interest) goes back to the circle pool.
;; Joint-liability: defaulter + their endorsers score is penalised.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u400))
(define-constant ERR-NOT-A-MEMBER        (err u401))
(define-constant ERR-LOAN-NOT-FOUND      (err u402))
(define-constant ERR-LOAN-ACTIVE         (err u403))
(define-constant ERR-INSUFFICIENT-TRUST  (err u404))
(define-constant ERR-POOL-INSUFFICIENT   (err u405))
(define-constant ERR-EXCEEDS-LIMIT       (err u406))
(define-constant ERR-REPAY-OVERFLOW      (err u407))
(define-constant ERR-NOT-IN-CIRCLE       (err u408))
(define-constant ERR-ALREADY-APPROVED    (err u409))
(define-constant ERR-LOAN-REPAID         (err u410))
(define-constant ERR-LOAN-NOT-DUE        (err u411))
(define-constant ERR-PROTOCOL-PAUSED     (err u412))
(define-constant ERR-ZERO-AMOUNT         (err u413))
(define-constant ERR-CIRCLE-NOT-FOUND    (err u414))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── Loan status constants ───────────────────────────────────────────────────
(define-constant LOAN-STATUS-PENDING   u1)
(define-constant LOAN-STATUS-ACTIVE    u2)
(define-constant LOAN-STATUS-REPAID    u3)
(define-constant LOAN-STATUS-DEFAULTED u4)

;; ─── Circle lending pools ────────────────────────────────────────────────────
(define-map circle-pools
  { circle-id: uint }
  {
    balance:        uint,
    total-lent:     uint,
    total-repaid:   uint,
    total-fees:     uint,
    loan-count:     uint
  }
)

;; ─── Loan records ────────────────────────────────────────────────────────────
(define-data-var loan-nonce uint u0)
(define-map loans
  { loan-id: uint }
  {
    borrower:     principal,
    circle-id:    uint,
    amount:       uint,
    fee:          uint,        ;; contribution fee deducted at repayment
    total-due:    uint,        ;; amount + fee
    amount-repaid: uint,
    status:       uint,
    approved-at:  uint,
    due-at:       uint,        ;; block-height deadline
    repaid-at:    uint,
    created-at:   uint
  }
)

;; ─── Active loan per borrower (one at a time per circle) ─────────────────────
(define-map borrower-active-loan
  { borrower: principal, circle-id: uint }
  { loan-id: uint }
)

;; ─── Depositor pool funding ───────────────────────────────────────────────────
(define-public (fund-pool (circle-id uint) (amount uint))
  (let (
    (caller tx-sender)
    (pool   (default-to
               { balance: u0, total-lent: u0, total-repaid: u0,
                 total-fees: u0, loan-count: u0 }
               (map-get? circle-pools { circle-id: circle-id })))
  )
    (asserts! (not (is-protocol-paused))                         ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                      ERR-ZERO-AMOUNT)
    (asserts! (contract-call? REGISTRY is-active-member caller)  ERR-NOT-A-MEMBER)
    (asserts! (contract-call? REGISTRY is-circle-member circle-id caller) ERR-NOT-IN-CIRCLE)
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    (map-set circle-pools { circle-id: circle-id }
      (merge pool { balance: (+ (get balance pool) amount) }))
    (ok (+ (get balance pool) amount))
  )
)

;; ─── Request a loan ──────────────────────────────────────────────────────────
(define-public (request-loan (circle-id uint) (amount uint))
  (let (
    (caller      tx-sender)
    (pool        (unwrap! (map-get? circle-pools { circle-id: circle-id })
                  ERR-CIRCLE-NOT-FOUND))
    (min-trust   (default-to u200
                   (match (contract-call? PROTOCOL-CFG get-param "loan-min-trust-score")
                     v (some v) none)))
    (multiplier  (default-to u5
                   (match (contract-call? PROTOCOL-CFG get-param "loan-max-multiplier")
                     v (some v) none)))
    (fee-bps     (default-to u200
                   (match (contract-call? PROTOCOL-CFG get-param "loan-fee-bps")
                     v (some v) none)))
    (repay-win   (default-to u4320
                   (match (contract-call? PROTOCOL-CFG get-param "loan-repay-window-blocks")
                     v (some v) none)))
    (borrower-score (unwrap! (contract-call? TRUST get-score caller)
                      ERR-INSUFFICIENT-TRUST))
    (max-loan    (* borrower-score multiplier))
    (fee         (/ (* amount fee-bps) u10000))
    (total-due   (+ amount fee))
    (loan-id     (+ (var-get loan-nonce) u1))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                                       ERR-ZERO-AMOUNT)
    (asserts! (contract-call? REGISTRY is-active-member caller)   ERR-NOT-A-MEMBER)
    (asserts! (contract-call? REGISTRY is-circle-member circle-id caller) ERR-NOT-IN-CIRCLE)
    (asserts! (>= borrower-score min-trust)                        ERR-INSUFFICIENT-TRUST)
    (asserts! (<= amount max-loan)                                 ERR-EXCEEDS-LIMIT)
    (asserts! (>= (get balance pool) amount)                       ERR-POOL-INSUFFICIENT)
    (asserts! (is-none (map-get? borrower-active-loan
                { borrower: caller, circle-id: circle-id }))       ERR-LOAN-ACTIVE)
    ;; Disburse funds
    (try! (as-contract
      (stx-transfer? amount tx-sender caller)))
    (map-set loans { loan-id: loan-id }
      { borrower: caller, circle-id: circle-id, amount: amount,
        fee: fee, total-due: total-due, amount-repaid: u0,
        status: LOAN-STATUS-ACTIVE,
        approved-at: block-height,
        due-at: (+ block-height repay-win),
        repaid-at: u0, created-at: block-height })
    (map-set borrower-active-loan { borrower: caller, circle-id: circle-id }
      { loan-id: loan-id })
    (map-set circle-pools { circle-id: circle-id }
      (merge pool
        { balance: (- (get balance pool) amount),
          total-lent: (+ (get total-lent pool) amount),
          loan-count: (+ (get loan-count pool) u1) }))
    (var-set loan-nonce loan-id)
    (ok loan-id)
  )
)

;; ─── Repay loan ──────────────────────────────────────────────────────────────
(define-public (repay (loan-id uint) (amount uint))
  (let (
    (caller tx-sender)
    (loan   (unwrap! (map-get? loans { loan-id: loan-id }) ERR-LOAN-NOT-FOUND))
    (pool   (unwrap! (map-get? circle-pools { circle-id: (get circle-id loan) })
             ERR-CIRCLE-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))    ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq caller (get borrower loan)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status loan) LOAN-STATUS-ACTIVE) ERR-LOAN-REPAID)
    (asserts! (> amount u0)                 ERR-ZERO-AMOUNT)
    (let ((remaining (- (get total-due loan) (get amount-repaid loan))))
      (asserts! (<= amount remaining)       ERR-REPAY-OVERFLOW)
      (try! (stx-transfer? amount caller (as-contract tx-sender)))
      (let (
        (new-repaid   (+ (get amount-repaid loan) amount))
        (fully-paid   (>= new-repaid (get total-due loan)))
        (new-status   (if fully-paid LOAN-STATUS-REPAID LOAN-STATUS-ACTIVE))
        (fee-portion  (/ (* amount (get fee loan)) (get total-due loan)))
      )
        (map-set loans { loan-id: loan-id }
          (merge loan
            { amount-repaid: new-repaid,
              status: new-status,
              repaid-at: (if fully-paid block-height u0) }))
        (map-set circle-pools { circle-id: (get circle-id loan) }
          (merge pool
            { balance:      (+ (get balance pool) amount),
              total-repaid: (+ (get total-repaid pool) amount),
              total-fees:   (+ (get total-fees pool) fee-portion) }))
        (if fully-paid
          (begin
            (map-delete borrower-active-loan
              { borrower: caller, circle-id: (get circle-id loan) })
            (try! (as-contract
              (contract-call? TRUST reward-loan-repay caller u50)))
            (ok true)
          )
          (ok false)
        )
      )
    )
  )
)

;; ─── Liquidate defaulter (anyone can call after due-at) ──────────────────────
(define-public (liquidate-defaulter (loan-id uint))
  (let (
    (loan  (unwrap! (map-get? loans { loan-id: loan-id }) ERR-LOAN-NOT-FOUND))
    (pool  (unwrap! (map-get? circle-pools { circle-id: (get circle-id loan) })
            ERR-CIRCLE-NOT-FOUND))
    (penalty (default-to u200
               (match (contract-call? PROTOCOL-CFG get-param "trust-default-penalty")
                 v (some v) none)))
  )
    (asserts! (not (is-protocol-paused))                      ERR-PROTOCOL-PAUSED)
    (asserts! (is-eq (get status loan) LOAN-STATUS-ACTIVE)     ERR-LOAN-REPAID)
    (asserts! (> block-height (get due-at loan))               ERR-LOAN-NOT-DUE)
    (map-set loans { loan-id: loan-id }
      (merge loan { status: LOAN-STATUS-DEFAULTED }))
    (map-delete borrower-active-loan
      { borrower: (get borrower loan), circle-id: (get circle-id loan) })
    ;; Penalise trust score
    (try! (as-contract
      (contract-call? TRUST penalize (get borrower loan) penalty "loan-default")))
    (ok true)
  )
)

;; ─── Read-only helpers ───────────────────────────────────────────────────────
(define-read-only (get-loan (loan-id uint))
  (map-get? loans { loan-id: loan-id })
)

(define-read-only (get-loan-status (loan-id uint))
  (match (map-get? loans { loan-id: loan-id })
    l (ok (get status l))
    ERR-LOAN-NOT-FOUND
  )
)

(define-read-only (get-pool (circle-id uint))
  (map-get? circle-pools { circle-id: circle-id })
)

(define-read-only (get-pool-balance (circle-id uint))
  (match (map-get? circle-pools { circle-id: circle-id })
    p (ok (get balance p))
    ERR-CIRCLE-NOT-FOUND
  )
)

(define-read-only (get-active-loan (borrower principal) (circle-id uint))
  (map-get? borrower-active-loan { borrower: borrower, circle-id: circle-id })
)

(define-read-only (get-max-loan-amount (borrower principal))
  (match (contract-call? TRUST get-score borrower)
    score (let ((multiplier (default-to u5
                (match (contract-call? PROTOCOL-CFG get-param "loan-max-multiplier")
                  v (some v) none))))
      (ok (* score multiplier)))
    e (err u0)
  )
)

(define-read-only (get-total-loans) (ok (var-get loan-nonce)))

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)
