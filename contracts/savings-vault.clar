;; savings-vault.clar
;; REXONOBIT — Bitcoin Savings Core
;; Members deposit sBTC (or STX as parallel track) into personal vaults.
;; Tracks streaks, deposit history, commitment locks.
;; Locked savings earn trust-score points via trust-score contract.

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u200))
(define-constant ERR-NOT-A-MEMBER        (err u201))
(define-constant ERR-VAULT-NOT-FOUND     (err u202))
(define-constant ERR-INSUFFICIENT-FUNDS  (err u203))
(define-constant ERR-STILL-LOCKED        (err u204))
(define-constant ERR-LOCK-TOO-SHORT      (err u205))
(define-constant ERR-ZERO-AMOUNT         (err u206))
(define-constant ERR-BELOW-MIN-DEPOSIT   (err u207))
(define-constant ERR-PROTOCOL-PAUSED     (err u208))
(define-constant ERR-ALREADY-INITIALIZED (err u209))
(define-constant ERR-LOCK-SHORTENING    (err u210))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant TRUST        .trust-score)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── Savings streak constants ────────────────────────────────────────────────
;; Deposit within this many blocks of last deposit = streak continues (~7 days)
(define-constant STREAK-WINDOW-BLOCKS u1008)

;; ─── Vault record ────────────────────────────────────────────────────────────
(define-map vaults
  { owner: principal }
  {
    balance:           uint,    ;; free (unlocked) balance in microSTX
    locked-balance:    uint,    ;; time-locked balance
    lock-until:        uint,    ;; block-height unlock point
    total-deposited:   uint,
    total-withdrawn:   uint,
    deposit-count:     uint,
    streak:            uint,    ;; consecutive deposit windows
    last-deposit-at:   uint,    ;; block-height
    initialized-at:   uint
  }
)

;; ─── Deposit history ─────────────────────────────────────────────────────────
(define-data-var deposit-nonce uint u0)
(define-map deposit-history
  { nonce: uint }
  {
    owner:     principal,
    amount:    uint,
    locked:    bool,
    lock-until: uint,
    at-block:  uint
  }
)

;; ─── Withdrawal history ──────────────────────────────────────────────────────
(define-data-var withdrawal-nonce uint u0)
(define-map withdrawal-history
  { nonce: uint }
  {
    owner:    principal,
    amount:   uint,
    at-block: uint
  }
)

;; ─── Initialize vault ────────────────────────────────────────────────────────
(define-public (initialize-vault)
  (let ((caller tx-sender))
    (asserts! (not (is-protocol-paused))                        ERR-PROTOCOL-PAUSED)
    (asserts! (contract-call? REGISTRY is-active-member caller) ERR-NOT-A-MEMBER)
    (asserts! (is-none (map-get? vaults { owner: caller }))     ERR-ALREADY-INITIALIZED)
    (map-set vaults { owner: caller }
      { balance: u0, locked-balance: u0, lock-until: u0,
        total-deposited: u0, total-withdrawn: u0, deposit-count: u0,
        streak: u0, last-deposit-at: u0, initialized-at: block-height })
    (ok true)
  )
)

;; ─── Deposit (free / unlocked) ───────────────────────────────────────────────
(define-public (deposit (amount uint))
  (let (
    (caller  tx-sender)
    (vault   (unwrap! (map-get? vaults { owner: caller }) ERR-VAULT-NOT-FOUND))
    (min-dep (default-to u1000000
               (match (contract-call? PROTOCOL-CFG get-param "min-deposit-ustx")
                 v (some v) none)))
  )
    (asserts! (not (is-protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)              ERR-ZERO-AMOUNT)
    (asserts! (>= amount min-dep)        ERR-BELOW-MIN-DEPOSIT)
    ;; Transfer STX from caller to this contract
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    ;; Update streak
    (let (
      (new-streak   (compute-streak (get last-deposit-at vault) (get streak vault)))
      (new-balance  (+ (get balance vault) amount))
      (new-total    (+ (get total-deposited vault) amount))
      (new-count    (+ (get deposit-count vault) u1))
      (dn           (+ (var-get deposit-nonce) u1))
    )
      (map-set vaults { owner: caller }
        (merge vault
          { balance: new-balance,
            total-deposited: new-total,
            deposit-count: new-count,
            streak: new-streak,
            last-deposit-at: block-height }))
      (map-set deposit-history { nonce: dn }
        { owner: caller, amount: amount, locked: false,
          lock-until: u0, at-block: block-height })
      (var-set deposit-nonce dn)
      ;; Reward trust score for deposit
      (try! (as-contract
        (contract-call? TRUST reward-savings caller u10)))
      (ok new-balance)
    )
  )
)

;; ─── Lock savings (time-locked deposit) ──────────────────────────────────────
(define-public (lock-savings (amount uint) (lock-blocks uint))
  (let (
    (caller   tx-sender)
    (vault    (unwrap! (map-get? vaults { owner: caller }) ERR-VAULT-NOT-FOUND))
    (min-lock (default-to u144
                (match (contract-call? PROTOCOL-CFG get-param "savings-lock-min-blocks")
                  v (some v) none)))
    (min-dep  (default-to u1000000
                (match (contract-call? PROTOCOL-CFG get-param "min-deposit-ustx")
                  v (some v) none)))
  )
    (asserts! (not (is-protocol-paused)) ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)              ERR-ZERO-AMOUNT)
    (asserts! (>= amount min-dep)        ERR-BELOW-MIN-DEPOSIT)
    (asserts! (>= lock-blocks min-lock)  ERR-LOCK-TOO-SHORT)
    ;; New lock must not shorten an existing lock period
    (asserts! (>= (+ block-height lock-blocks) (get lock-until vault))
              ERR-LOCK-SHORTENING)
    (try! (stx-transfer? amount caller (as-contract tx-sender)))
    (let (
      (unlock-at    (+ block-height lock-blocks))
      (new-locked   (+ (get locked-balance vault) amount))
      (new-total    (+ (get total-deposited vault) amount))
      (new-count    (+ (get deposit-count vault) u1))
      (new-streak   (compute-streak (get last-deposit-at vault) (get streak vault)))
      (dn           (+ (var-get deposit-nonce) u1))
      ;; Bonus points for locking: proportional to lock duration
      (lock-bonus   (/ (* amount lock-blocks) u100000000))
      (points       (+ u20 (if (> lock-bonus u50) u50 lock-bonus)))
    )
      (map-set vaults { owner: caller }
        (merge vault
          { locked-balance: new-locked,
            lock-until: unlock-at,
            total-deposited: new-total,
            deposit-count: new-count,
            streak: new-streak,
            last-deposit-at: block-height }))
      (map-set deposit-history { nonce: dn }
        { owner: caller, amount: amount, locked: true,
          lock-until: unlock-at, at-block: block-height })
      (var-set deposit-nonce dn)
      (try! (as-contract
        (contract-call? TRUST reward-savings caller points)))
      (ok unlock-at)
    )
  )
)

;; ─── Withdraw unlocked balance ───────────────────────────────────────────────
(define-public (withdraw (amount uint))
  (let (
    (caller tx-sender)
    (vault  (unwrap! (map-get? vaults { owner: caller }) ERR-VAULT-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))       ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                    ERR-ZERO-AMOUNT)
    (asserts! (>= (get balance vault) amount)  ERR-INSUFFICIENT-FUNDS)
    (try! (as-contract
      (stx-transfer? amount tx-sender caller)))
    (let (
      (wn (+ (var-get withdrawal-nonce) u1))
    )
      (map-set vaults { owner: caller }
        (merge vault
          { balance: (- (get balance vault) amount),
            total-withdrawn: (+ (get total-withdrawn vault) amount) }))
      (map-set withdrawal-history { nonce: wn }
        { owner: caller, amount: amount, at-block: block-height })
      (var-set withdrawal-nonce wn)
      (ok (- (get balance vault) amount))
    )
  )
)

;; ─── Withdraw locked balance (only after lock expires) ───────────────────────
(define-public (withdraw-locked (amount uint))
  (let (
    (caller tx-sender)
    (vault  (unwrap! (map-get? vaults { owner: caller }) ERR-VAULT-NOT-FOUND))
  )
    (asserts! (not (is-protocol-paused))              ERR-PROTOCOL-PAUSED)
    (asserts! (> amount u0)                           ERR-ZERO-AMOUNT)
    (asserts! (>= block-height (get lock-until vault)) ERR-STILL-LOCKED)
    (asserts! (>= (get locked-balance vault) amount)   ERR-INSUFFICIENT-FUNDS)
    (try! (as-contract
      (stx-transfer? amount tx-sender caller)))
    (let ((wn (+ (var-get withdrawal-nonce) u1)))
      (map-set vaults { owner: caller }
        (merge vault
          { locked-balance: (- (get locked-balance vault) amount),
            total-withdrawn: (+ (get total-withdrawn vault) amount) }))
      (map-set withdrawal-history { nonce: wn }
        { owner: caller, amount: amount, at-block: block-height })
      (var-set withdrawal-nonce wn)
      (ok (- (get locked-balance vault) amount))
    )
  )
)

;; ─── Internal: compute deposit streak ───────────────────────────────────────
(define-private (compute-streak (last-deposit uint) (current-streak uint))
  (if (is-eq last-deposit u0)
    u1
    (if (<= (- block-height last-deposit) STREAK-WINDOW-BLOCKS)
      (+ current-streak u1)
      u1
    )
  )
)

;; ─── Read-only helpers ───────────────────────────────────────────────────────
(define-read-only (get-vault (owner principal))
  (map-get? vaults { owner: owner })
)

(define-read-only (get-vault-balance (owner principal))
  (match (map-get? vaults { owner: owner })
    v (ok (get balance v))
    ERR-VAULT-NOT-FOUND
  )
)

(define-read-only (get-locked-balance (owner principal))
  (match (map-get? vaults { owner: owner })
    v (ok (get locked-balance v))
    ERR-VAULT-NOT-FOUND
  )
)

(define-read-only (get-total-balance (owner principal))
  (match (map-get? vaults { owner: owner })
    v (ok (+ (get balance v) (get locked-balance v)))
    ERR-VAULT-NOT-FOUND
  )
)

(define-read-only (streak-status (owner principal))
  (match (map-get? vaults { owner: owner })
    v (ok (get streak v))
    ERR-VAULT-NOT-FOUND
  )
)

(define-read-only (is-locked (owner principal))
  (match (map-get? vaults { owner: owner })
    v (ok (> (get lock-until v) block-height))
    ERR-VAULT-NOT-FOUND
  )
)

(define-read-only (get-deposit-record (nonce uint))
  (map-get? deposit-history { nonce: nonce })
)

(define-read-only (get-withdrawal-record (nonce uint))
  (map-get? withdrawal-history { nonce: nonce })
)

(define-read-only (get-total-deposits)  (ok (var-get deposit-nonce)))
(define-read-only (get-total-withdrawals) (ok (var-get withdrawal-nonce)))

;; ─── Internal: paused flag ───────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused)
    v v false
  )
)
