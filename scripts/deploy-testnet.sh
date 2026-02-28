#!/usr/bin/env bash
# deploy-testnet.sh — Deploy REXONOBIT contracts to Stacks Testnet
# Usage: ./scripts/deploy-testnet.sh
# Requires: STACKS_PRIVATE_KEY env var set (NEVER commit keys)

set -euo pipefail

: "${STACKS_PRIVATE_KEY:?ERROR: Set STACKS_PRIVATE_KEY environment variable before deploying}"

NETWORK="testnet"
STACKS_API="https://api.testnet.hiro.so"
FEE_RATE=2000

CONTRACTS=(
  "protocol-config"
  "cooperative-registry"
  "trust-score"
  "savings-vault"
  "lending-pool"
  "rosca"
  "labor-market"
  "treasury"
  "governance"
  "arbitration"
  "reputation-nft"
  "synthetic-credit"
)

echo "=== REXONOBIT Testnet Deployment ==="
echo "Network : $NETWORK"
echo "API     : $STACKS_API"
echo ""

for contract in "${CONTRACTS[@]}"; do
  echo "Deploying: $contract ..."
  clarinet deploy \
    --contract "$contract" \
    --network "$NETWORK" \
    --fee "$FEE_RATE" \
    --private-key "$STACKS_PRIVATE_KEY"
  echo "  ✓ $contract deployed"
  sleep 2
done

echo ""
echo "=== All contracts deployed to Testnet ==="
echo "Verify at: https://explorer.stacks.co/?chain=testnet"
