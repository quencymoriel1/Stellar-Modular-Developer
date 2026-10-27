import { buildProxyServer } from './server';

export * from './server';
export * from './interceptor';
export * from './verifier';
export * from './forwarder';

if (require.main === module) {
  const port = Number(process.env.PORT) || 4020;
  const host = process.env.HOST || '0.0.0.0';
  const server = buildProxyServer({ port, host });

  server.listen({ port, host }, (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    console.log(`\n⚡ Stellar Modular Developer Edge Proxy running at: ${address}`);
    console.log(`📡 Ready to intercept & monetize APIs on Stellar Testnet!`);
  });
}
