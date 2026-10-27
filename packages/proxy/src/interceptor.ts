import { FastifyReply, FastifyRequest } from 'fastify';
import {
  generateNonce,
  formatStroops,
  STELLAR_CONFIG,
  StellarX402Challenge,
  ServiceDefinition,
} from '@stellar-modular/shared';

export function createX402Challenge(
  service: ServiceDefinition,
  resource: string,
  nonce?: string
): StellarX402Challenge {
  const finalNonce = nonce || generateNonce();
  const priceStroops = service.priceStroops.toString();
  const isUsdc = service.tokenAddress.toUpperCase() === STELLAR_CONFIG.TESTNET.testnetUsdc.toUpperCase();
  const assetCode = isUsdc ? 'USDC' : 'XLM';

  return {
    x402Version: 2,
    title: `Payment Required — ${service.name}`,
    description: `Access to ${service.name} requires an on-chain Stellar micropayment of ${formatStroops(priceStroops)} ${assetCode}.`,
    serviceId: service.serviceId,
    accepts: [
      {
        scheme: 'exact',
        network: 'stellar-testnet',
        contractId: STELLAR_CONFIG.TESTNET.contractId,
        serviceId: service.serviceId,
        priceStroops,
        priceFormatted: `${formatStroops(priceStroops)} ${assetCode}`,
        assetCode,
        assetContractId: service.tokenAddress,
        provider: service.provider,
        resource,
        nonce: finalNonce,
      },
      {
        scheme: 'tier',
        network: 'stellar-testnet',
        contractId: STELLAR_CONFIG.TESTNET.contractId,
        serviceId: service.serviceId,
        priceStroops: '1000000',
        priceFormatted: `0.10 ${assetCode}`,
        assetCode,
        assetContractId: service.tokenAddress,
        provider: service.provider,
        resource,
        nonce: finalNonce,
        availableTiers: [
          {
            tierId: 1,
            priceStroops: '1000000',
            maxCalls: 100,
            durationLedgers: 10000,
          },
        ],
      },
    ],
  };
}

export function send402PaymentRequired(
  reply: FastifyReply,
  challenge: StellarX402Challenge
): void {
  const nonce = challenge.accepts[0]?.nonce || '';
  reply
    .status(402)
    .header('Content-Type', 'application/json; charset=utf-8')
    .header('WWW-Authenticate', `Stellar-x402 contract="${challenge.accepts[0]?.contractId}", nonce="${nonce}"`)
    .header(STELLAR_CONFIG.HEADERS.NONCE, nonce)
    .header(STELLAR_CONFIG.HEADERS.CHALLENGE, Buffer.from(JSON.stringify(challenge)).toString('base64'))
    .send(challenge);
}
