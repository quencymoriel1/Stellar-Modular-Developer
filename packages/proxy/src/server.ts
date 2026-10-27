import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { SorobanHelper, STELLAR_CONFIG } from '@stellar-modular/shared';
import { createX402Challenge, send402PaymentRequired } from './interceptor';
import { PaymentVerifier } from './verifier';
import { forwardToOrigin } from './forwarder';

export interface ProxyServerOptions {
  port?: number;
  host?: string;
  contractId?: string;
  rpcUrl?: string;
}

export function buildProxyServer(options: ProxyServerOptions = {}): FastifyInstance {
  const server = Fastify({ logger: true });

  const helper = new SorobanHelper(
    options.rpcUrl || STELLAR_CONFIG.TESTNET.rpcUrl,
    STELLAR_CONFIG.TESTNET.networkPassphrase,
    options.contractId || STELLAR_CONFIG.TESTNET.contractId
  );
  const verifier = new PaymentVerifier(helper);

  // Register CORS
  server.register(cors, {
    origin: true,
    exposedHeaders: [
      STELLAR_CONFIG.HEADERS.PAYMENT,
      STELLAR_CONFIG.HEADERS.PAYMENT_RESPONSE,
      STELLAR_CONFIG.HEADERS.NONCE,
      STELLAR_CONFIG.HEADERS.CHALLENGE,
      'www-authenticate',
    ],
  });

  // Rate Limiting
  server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Health check
  server.get('/health', async () => ({
    status: 'ok',
    version: '2.0.0',
    service: 'Stellar Modular Developer Proxy',
    network: 'stellar-testnet',
    contractId: helper.getContractId(),
    timestamp: new Date().toISOString(),
  }));

  // Proxy route
  server.all('/p/:serviceId', handleProxyRequest);
  server.all('/p/:serviceId/*', handleProxyRequest);

  async function handleProxyRequest(req: any, reply: any) {
    const { serviceId } = req.params;
    const originFallback = 'https://httpbin.org/get';

    // Fetch on-chain service metadata
    let service = await helper.getService(serviceId);
    if (!service) {
      // Default fallback for demo/testing
      service = {
        serviceId,
        name: serviceId.replace(/_/g, ' ').toUpperCase(),
        originUrl: originFallback,
        priceStroops: 100000n, // 0.01 XLM
        tokenAddress: STELLAR_CONFIG.TESTNET.nativeSac,
        revSplitBps: 8000,
        metadataUri: originFallback,
        active: true,
        provider: STELLAR_CONFIG.TESTNET.deployerPublicKey,
        totalCalls: 0n,
        totalVolume: 0n,
        createdAt: Date.now(),
      };
    }

    const fullUrl = `${req.protocol}://${req.hostname}${req.url}`;
    const paymentHeader = req.headers[STELLAR_CONFIG.HEADERS.PAYMENT] as string | undefined;

    // If no payment header present -> issue 402 challenge
    if (!paymentHeader) {
      const challenge = createX402Challenge(service, fullUrl);
      return send402PaymentRequired(reply, challenge);
    }

    // Verify incoming payment
    const verification = await verifier.verifyPayment(paymentHeader, service);
    if (!verification.valid || !verification.receipt) {
      const challenge = createX402Challenge(service, fullUrl);
      reply.header('X-Payment-Error', verification.error || 'Verification failed');
      return send402PaymentRequired(reply, challenge);
    }

    // Forward to origin API and inject receipt
    const originUrl = service.originUrl.startsWith('http') ? service.originUrl : originFallback;
    return forwardToOrigin(req, reply, originUrl, verification.receipt);
  }

  return server;
}
