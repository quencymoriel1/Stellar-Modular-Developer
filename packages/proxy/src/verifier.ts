import {
  SorobanHelper,
  StellarPaymentPayload,
  StellarPaymentReceipt,
  ServiceDefinition,
  isValidNonce,
  STELLAR_CONFIG,
} from '@stellar-modular/shared';

export class PaymentVerifier {
  private helper: SorobanHelper;
  private settledNonces: Set<string>;

  constructor(helper: SorobanHelper) {
    this.helper = helper;
    this.settledNonces = new Set();
  }

  async verifyPayment(
    paymentHeaderRaw: string | undefined,
    service: ServiceDefinition
  ): Promise<{ valid: boolean; receipt?: StellarPaymentReceipt; error?: string }> {
    if (!paymentHeaderRaw) {
      return { valid: false, error: 'Missing X-Stellar-Payment header' };
    }

    let payload: StellarPaymentPayload;
    try {
      const decoded = paymentHeaderRaw.startsWith('{')
        ? paymentHeaderRaw
        : Buffer.from(paymentHeaderRaw, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return { valid: false, error: 'Malformed X-Stellar-Payment header' };
    }

    if (!payload.caller || !payload.serviceId || !payload.nonce) {
      return { valid: false, error: 'Incomplete payment payload' };
    }

    if (!isValidNonce(payload.nonce)) {
      return { valid: false, error: 'Invalid cryptographic nonce' };
    }

    // Check memory replay cache
    if (this.settledNonces.has(payload.nonce)) {
      return { valid: false, error: 'Nonce already settled (replay rejected)' };
    }

    // Mode 1: Active subscription pass check
    if (payload.mode === 'tier_access' || payload.mode === 'quota_pass') {
      const hasAccess = await this.helper.checkAccess(payload.caller, service.serviceId);
      if (hasAccess) {
        this.settledNonces.add(payload.nonce);
        return {
          valid: true,
          receipt: {
            status: 'verified',
            txHash: payload.txHash || 'tier_quota_authorized',
            ledger: 0,
            caller: payload.caller,
            provider: service.provider,
            serviceId: service.serviceId,
            nonce: payload.nonce,
            amountStroops: '0',
            assetContractId: service.tokenAddress,
            settledAt: new Date().toISOString(),
          },
        };
      }
      return { valid: false, error: 'Subscription tier pass invalid or expired' };
    }

    // Mode 2: Direct call with on-chain settlement tx
    if (payload.txHash) {
      const verifiedTx = await this.helper.verifyTransaction(payload.txHash);
      if (verifiedTx.success) {
        this.settledNonces.add(payload.nonce);
        return {
          valid: true,
          receipt: {
            status: 'settled',
            txHash: payload.txHash,
            ledger: verifiedTx.ledger || 0,
            caller: payload.caller,
            provider: service.provider,
            serviceId: service.serviceId,
            nonce: payload.nonce,
            amountStroops: service.priceStroops.toString(),
            assetContractId: service.tokenAddress,
            settledAt: verifiedTx.createdAt || new Date().toISOString(),
          },
        };
      }
      return { valid: false, error: 'Transaction unconfirmed or failed on Stellar Testnet' };
    }

    return { valid: false, error: 'No valid settlement transaction or active subscription provided' };
  }
}
