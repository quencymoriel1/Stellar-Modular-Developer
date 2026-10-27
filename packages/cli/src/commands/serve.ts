import chalk from 'chalk';
import { buildProxyServer } from '@stellar-modular/proxy';

export async function serveCommand(options: any) {
  const port = Number(options.port) || 4020;
  const host = options.host || '0.0.0.0';

  console.log(chalk.cyan.bold('\n⚡ Starting Stellar Modular Developer Edge Reverse Proxy'));
  console.log(chalk.gray(`Listening on http://${host}:${port}\n`));

  const server = buildProxyServer({ port, host });
  server.listen({ port, host }, (err, address) => {
    if (err) {
      console.error(chalk.red(`Failed to bind proxy server: ${err.message}`));
      process.exit(1);
    }
    console.log(chalk.green(`✓ Proxy Gateway active at ${address}`));
    console.log(chalk.gray(`• Health check: ${address}/health`));
    console.log(chalk.gray(`• Proxied route pattern: ${address}/p/<serviceId>\n`));
  });
}
