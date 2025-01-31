;; Skill Certification Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-unauthorized (err u103))

;; Data Variables
(define-map certifiers principal bool)
(define-map certificates
    { holder: principal, skill-id: uint }
    { issuer: principal, timestamp: uint, valid: bool }
)
(define-map skills 
    uint 
    { name: (string-ascii 64), description: (string-ascii 256) }
)
(define-data-var skill-counter uint u0)

;; Private Functions
(define-private (is-certifier (issuer principal))
    (default-to false (map-get? certifiers issuer))
)

;; Public Functions
(define-public (register-certifier (new-certifier principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set certifiers new-certifier true)
        (ok true)
    )
)

(define-public (add-skill (name (string-ascii 64)) (description (string-ascii 256)))
    (let 
        ((skill-id (+ (var-get skill-counter) u1)))
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set skills skill-id { name: name, description: description })
        (var-set skill-counter skill-id)
        (ok skill-id)
    )
)

(define-public (issue-certificate (holder principal) (skill-id uint))
    (begin
        (asserts! (is-certifier tx-sender) err-unauthorized)
        (asserts! (is-some (map-get? skills skill-id)) err-not-found)
        (asserts! (is-none (map-get? certificates { holder: holder, skill-id: skill-id })) err-already-exists)
        (map-set certificates 
            { holder: holder, skill-id: skill-id }
            { issuer: tx-sender, timestamp: block-height, valid: true }
        )
        (ok true)
    )
)

(define-public (revoke-certificate (holder principal) (skill-id uint))
    (let ((cert (map-get? certificates { holder: holder, skill-id: skill-id })))
        (asserts! (is-some cert) err-not-found)
        (asserts! (or 
            (is-eq tx-sender contract-owner)
            (is-eq tx-sender (get issuer (unwrap-panic cert)))
        ) err-unauthorized)
        (map-set certificates
            { holder: holder, skill-id: skill-id }
            { issuer: (get issuer (unwrap-panic cert)), 
              timestamp: block-height, 
              valid: false }
        )
        (ok true)
    )
)

;; Read-only Functions
(define-read-only (get-certificate (holder principal) (skill-id uint))
    (ok (map-get? certificates { holder: holder, skill-id: skill-id }))
)

(define-read-only (get-skill (skill-id uint))
    (ok (map-get? skills skill-id))
)

(define-read-only (is-certificate-valid (holder principal) (skill-id uint))
    (let ((cert (map-get? certificates { holder: holder, skill-id: skill-id })))
        (if (is-some cert)
            (ok (get valid (unwrap-panic cert)))
            err-not-found
        )
    )
)
