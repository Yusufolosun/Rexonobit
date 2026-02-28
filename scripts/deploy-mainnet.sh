#!/usr/bin/env bash
# deploy-mainnet.sh — Deploy REXONOBIT contracts to Stacks Mainnet
# Usage: ./scripts/deploy-mainnet.sh
# 
# SAFETY: Requires explicit --confirm-mainnet flag AND STACKS_PRIVATE_KEY env var
# NEVER commit private keys or mnemonics to this repository

set -euo pipefail

CONFIRM="${1:-}"
if [[ "$CONFIRM" != "--confirm-mainnet" ]]; then
  echo "ERROR: Mainnet deployment requires explicit confirmation."
  echo "Usage: $0 --confirm-mainnet"
  echo ""
  echo "This will deploy to MAINNET and consume real STX in fees."
  echo "Ensure you have reviewed all contract code before proceeding."
  exit 1
fi

: "${STACKS_PRIVATE_KEY:?ERROR: Set STACKS_PRIVATE_KEY environment variable before deploying}"

NETWORK="mainnet"
STACKS_API="https://api.mainnet.hiro.so"
FEE_RATE=5000

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

echo ""
echo "!!!  MAINNET DEPLOYMENT  !!!"
echo "Network : $NETWORK"
echo "API     : $STACKS_API"
echo "Fee     : $FEE_RATE microSTX per contract"
echo ""
echo "Proceeding in 5 seconds... Ctrl+C to abort."
sleep 5

for contract in "${CONTRACTS[@]}"; do
  echo "Deploying: $contract ..."
  clarinet deploy \
    --contract "$contract" \
    --network "$NETWORK" \
    --fee "$FEE_RATE" \
    --private-key "$STACKS_PRIVATE_KEY"
  echo "  ✓ $contract deployed to mainnet"
  sleep 3
done

echo ""
echo "=== All contracts deployed to Mainnet ==="
echo "Verify at: https://explorer.stacks.co/?chain=mainnet"
