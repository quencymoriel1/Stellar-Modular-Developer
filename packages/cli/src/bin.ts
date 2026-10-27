#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerCommand } from './commands/register';
import { serveCommand } from './commands/serve';
import { callCommand } from './commands/call';
import { faucetCommand } from './commands/faucet';

const program = new Command();

program
  .name('smd')
  .description('Stellar Modular Developer — Decentralized API Monetization CLI')
  .version('2.0.0');

program
  .command('register')
  .description('Register a new API endpoint on the Soroban smart contract')
  .option('-o, --origin <url>', 'Origin API URL to monetize')
  .option('-i, --id <serviceId>', 'Unique service ID slug')
  .option('-n, --name <name>', 'Service display name')
  .option('-p, --price <amount>', 'Price per call in tokens', '0.01')
  .option('-a, --asset <asset>', 'Settlement asset (XLM or USDC)', 'XLM')
  .option('-s, --secret <secretKey>', 'Provider secret key')
  .action(registerCommand);

program
  .command('serve')
  .description('Start edge reverse proxy enforcing Stellar x402 micropayments')
  .option('-p, --port <port>', 'Proxy port', '4020')
  .option('-h, --host <host>', 'Proxy host', '0.0.0.0')
  .action(serveCommand);

program
  .command('get <url>')
  .alias('call')
  .description('Execute an HTTP GET request to an x402 endpoint with automated testnet payment signing')
  .option('-s, --secret <secretKey>', 'Caller secret key for signing payment')
  .action(callCommand);

program
  .command('faucet [address]')
  .description('Generate or fund a Stellar testnet account with 10,000 XLM')
  .action(faucetCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
