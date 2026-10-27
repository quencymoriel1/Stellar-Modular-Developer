/**
 * Stellar Modular Developer x402 Specification
 * Compatible with RFC HTTP 402 Payment Required for Stellar Soroban
 */

export interface StellarX402AcceptOption {
  scheme: 'exact' | 'streaming' | 'tier';
  network: 'stellar-testnet' | 'stellar-mainnet';
  contractId: string;
  serviceId: string;
  priceStroops: string;
  priceFormatted: string;
  assetCode: string;
  assetIssuer?: string;
  assetContractId: string;
  provider: string;
  resource: string;
  nonce: string;
  expiresAtLedger?: number;
  availableTiers?: {
    tierId: number;
    priceStroops: string;
    maxCalls: number;
    durationLedgers: number;
  }[];
}

export interface StellarX402Challenge {
  x402Version: 2;
  title: string;
  description: string;
  serviceId: string;
  accepts: StellarX402AcceptOption[];
}

export interface StellarPaymentPayload {
  version: 2;
  network: 'stellar-testnet' | 'stellar-mainnet';
  contractId: string;
  serviceId: string;
  nonce: string;
  txHash?: string;
  signedEnvelopeXdr?: string;
  caller: string;
  mode: 'direct_call' | 'tier_access' | 'quota_pass';
  tierId?: number;
}

export interface StellarPaymentReceipt {
  status: 'settled' | 'verified' | 'cached';
  txHash: string;
  ledger: number;
  caller: string;
  provider: string;
  serviceId: string;
  nonce: string;
  amountStroops: string;
  assetContractId: string;
  settledAt: string;
}

export interface ServiceDefinition {
  serviceId: string;
  name: string;
  originUrl: string;
  priceStroops: bigint;
  tokenAddress: string;
  revSplitBps: number;
  metadataUri: string;
  active: boolean;
  provider: string;
  totalCalls: bigint;
  totalVolume: bigint;
  createdAt: number;
}
