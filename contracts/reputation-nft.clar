;; reputation-nft.clar
;; REXONOBIT — Soulbound Achievement NFTs
;; Non-transferable NFTs minted to members upon protocol milestones.
;; Badges: first-loan-repaid, savings-streak-6m, 10-tasks-done, circle-founder.
;; transfer is intentionally blocked — soulbound to original minter.

;; ─── SIP-009 NFT trait (partial, soulbound override) ────────────────────────
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; ─── Error codes ─────────────────────────────────────────────────────────────
(define-constant ERR-NOT-AUTHORIZED      (err u900))
(define-constant ERR-NOT-A-MEMBER        (err u901))
(define-constant ERR-BADGE-NOT-FOUND     (err u902))
(define-constant ERR-ALREADY-HAS-BADGE   (err u903))
(define-constant ERR-TRANSFER-BLOCKED    (err u904))
(define-constant ERR-NOT-TOKEN-OWNER     (err u905))
(define-constant ERR-PROTOCOL-PAUSED     (err u906))
(define-constant ERR-UNAUTHORIZED-MINTER (err u907))

;; ─── Contract references ─────────────────────────────────────────────────────
(define-constant REGISTRY     .cooperative-registry)
(define-constant PROTOCOL-CFG .protocol-config)

;; ─── NFT definition ──────────────────────────────────────────────────────────
(define-non-fungible-token rexonobit-badge uint)

;; ─── Token IDs ───────────────────────────────────────────────────────────────
(define-data-var last-token-id uint u0)

;; ─── Badge type constants ────────────────────────────────────────────────────
(define-constant BADGE-FIRST-LOAN-REPAID    u1)
(define-constant BADGE-SAVINGS-STREAK-6M    u2)
(define-constant BADGE-10-TASKS-DONE        u3)
(define-constant BADGE-CIRCLE-FOUNDER       u4)
(define-constant BADGE-ROSCA-COMPLETER      u5)
(define-constant BADGE-DISPUTE-ARBITRATOR   u6)
(define-constant BADGE-COOPERATIVE-VETERAN  u7)  ;; 1 year active

;; ─── Token metadata ──────────────────────────────────────────────────────────
(define-map token-metadata
  { token-id: uint }
  {
    badge-type:  uint,
    owner:       principal,
    minted-at:   uint,
    burned:      bool
  }
)

;; ─── Member badge index (one badge per type per member) ──────────────────────
(define-map member-badges
  { member: principal, badge-type: uint }
  { token-id: uint }
)

;; ─── Authorized minter contracts ────────────────────────────────────────────
(define-map authorized-minters { minter: principal } { enabled: bool })
(define-data-var admin principal tx-sender)

;; ─── SIP-009: get-last-token-id ──────────────────────────────────────────────
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

;; ─── SIP-009: get-token-uri ──────────────────────────────────────────────────
(define-read-only (get-token-uri (token-id uint))
  (match (map-get? token-metadata { token-id: token-id })
    meta (ok (some (concat "https://rexonobit.xyz/badges/"
                    (concat (int-to-ascii (get badge-type meta)) ".json"))))
    (ok none)
  )
)

;; ─── SIP-009: get-owner ──────────────────────────────────────────────────────
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? rexonobit-badge token-id))
)

;; ─── SIP-009: transfer — BLOCKED (soulbound) ─────────────────────────────────
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  ERR-TRANSFER-BLOCKED
)

;; ─── Mint a badge ────────────────────────────────────────────────────────────
(define-public (mint-badge (member principal) (badge-type uint))
  (let (
    (caller   tx-sender)
    (token-id (+ (var-get last-token-id) u1))
  )
    (asserts! (not (is-protocol-paused))                          ERR-PROTOCOL-PAUSED)
    (asserts! (or (is-authorized-minter caller)
                  (is-eq caller (var-get admin)))                  ERR-UNAUTHORIZED-MINTER)
    (asserts! (contract-call? REGISTRY is-active-member member)   ERR-NOT-A-MEMBER)
    (asserts! (is-none (map-get? member-badges
                { member: member, badge-type: badge-type }))       ERR-ALREADY-HAS-BADGE)
    (try! (nft-mint? rexonobit-badge token-id member))
    (map-set token-metadata { token-id: token-id }
      { badge-type: badge-type, owner: member,
        minted-at: block-height, burned: false })
    (map-set member-badges { member: member, badge-type: badge-type }
      { token-id: token-id })
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; ─── Burn a badge (penalty — protocol admin or authorized contract) ───────────
(define-public (burn-badge (token-id uint))
  (let (
    (caller tx-sender)
    (meta   (unwrap! (map-get? token-metadata { token-id: token-id }) ERR-BADGE-NOT-FOUND))
  )
    (asserts! (or (is-authorized-minter caller)
                  (is-eq caller (var-get admin)))              ERR-NOT-AUTHORIZED)
    (try! (nft-burn? rexonobit-badge token-id (get owner meta)))
    (map-set token-metadata { token-id: token-id }
      (merge meta { burned: true }))
    (map-delete member-badges
      { member: (get owner meta), badge-type: (get badge-type meta) })
    (ok true)
  )
)

;; ─── Authorize / deauthorize minter ─────────────────────────────────────────
(define-public (set-authorized-minter (minter principal) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set authorized-minters { minter: minter } { enabled: enabled })
    (ok true)
  )
)

;; ─── Read-only helpers ───────────────────────────────────────────────────────
(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata { token-id: token-id })
)

(define-read-only (get-badges (member principal) (badge-type uint))
  (map-get? member-badges { member: member, badge-type: badge-type })
)

(define-read-only (has-badge (member principal) (badge-type uint))
  (is-some (map-get? member-badges { member: member, badge-type: badge-type }))
)

(define-read-only (is-authorized-minter (minter principal))
  (match (map-get? authorized-minters { minter: minter })
    entry (get enabled entry)
    false
  )
)

;; ─── Internal ────────────────────────────────────────────────────────────────
(define-private (is-protocol-paused)
  (match (contract-call? PROTOCOL-CFG is-paused) v v false)
)

(define-private (int-to-ascii (n uint))
  (if (is-eq n u1) "1"
  (if (is-eq n u2) "2"
  (if (is-eq n u3) "3"
  (if (is-eq n u4) "4"
  (if (is-eq n u5) "5"
  (if (is-eq n u6) "6"
  (if (is-eq n u7) "7"
  "0")))))))
)
