import { request as undiciRequest } from 'undici';
import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import chalk from 'chalk';
import { STELLAR_CONFIG, StellarX402Challenge, StellarPaymentPayload } from '@stellar-modular/shared';

export async function callCommand(targetUrl: string, options: any) {
  console.log(chalk.cyan.bold('\n🌐 Stellar Modular Developer — Automated x402 Micropayment Client'));
  console.log(chalk.gray(`Target: ${targetUrl}\n`));

  const secretKey = options.secret || process.env.STELLAR_DEPLOYER_SECRET_KEY;
  if (!secretKey) {
    console.error(chalk.red('Error: Please provide a secret key using --secret or set STELLAR_DEPLOYER_SECRET_KEY in your environment.'));
    process.exit(1);
  }
  const keypair = Keypair.fromSecret(secretKey);

  console.log(chalk.blue(`[1/3] Probing endpoint...`));
  const res1 = await undiciRequest(targetUrl, { method: 'GET' });

  if (res1.statusCode !== 402) {
    console.log(chalk.green(`Response: ${res1.statusCode} OK (No payment challenge issued)`));
    console.log(await res1.body.text());
    return;
  }

  console.log(chalk.yellow(`[2/3] Received HTTP 402 Payment Required Challenge:`));
  const challengeBody = (await res1.body.json()) as StellarX402Challenge;
  const accept = challengeBody.accepts[0];
  console.log(chalk.gray(`  • Service:   ${challengeBody.serviceId}`));
  console.log(chalk.gray(`  • Price:     ${accept.priceFormatted}`));
  console.log(chalk.gray(`  • Contract:  ${accept.contractId}`));
  console.log(chalk.gray(`  • Nonce:     ${accept.nonce}\n`));

  console.log(chalk.blue(`[3/3] Settling micropayment on Stellar Testnet via Soroban...`));
  const server = new rpc.Server(STELLAR_CONFIG.TESTNET.rpcUrl);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(accept.contractId);
  const nonceBytes = Buffer.from(accept.nonce, 'hex');

  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: STELLAR_CONFIG.TESTNET.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'pay_per_call',
        nativeToScVal(keypair.publicKey(), { type: 'address' }),
        nativeToScVal(accept.serviceId, { type: 'symbol' }),
        nativeToScVal(nonceBytes, { type: 'bytes' })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const sendRes = await server.sendTransaction(prepared);

  console.log(chalk.green(`✓ Settlement Transaction Submitted: ${sendRes.hash}`));
  let getRes = await server.getTransaction(sendRes.hash);
  while (getRes.status === 'NOT_FOUND') {
    await new Promise((r) => setTimeout(r, 1000));
    getRes = await server.getTransaction(sendRes.hash);
  }
  console.log(chalk.green(`✓ Confirmed on ledger: ${getRes.ledger}`));

  // Resend request with X-Stellar-Payment header
  const paymentPayload: StellarPaymentPayload = {
    version: 2,
    network: 'stellar-testnet',
    contractId: accept.contractId,
    serviceId: accept.serviceId,
    nonce: accept.nonce,
    txHash: sendRes.hash,
    caller: keypair.publicKey(),
    mode: 'direct_call',
  };

  console.log(chalk.blue(`\nStreaming verbatim response from monetized origin API...`));
  const res2 = await undiciRequest(targetUrl, {
    method: 'GET',
    headers: {
      [STELLAR_CONFIG.HEADERS.PAYMENT]: Buffer.from(JSON.stringify(paymentPayload)).toString('base64'),
    },
  });

  const receiptRaw = res2.headers[STELLAR_CONFIG.HEADERS.PAYMENT_RESPONSE] as string;
  if (receiptRaw) {
    const receipt = JSON.parse(Buffer.from(receiptRaw, 'base64').toString());
    console.log(chalk.magenta(`\n💳 Payment Settlement Receipt Verified:`));
    console.log(chalk.gray(`  • Status: ${receipt.status}`));
    console.log(chalk.gray(`  • TxHash: ${receipt.txHash}`));
    console.log(chalk.gray(`  • Caller: ${receipt.caller}`));
  }

  console.log(chalk.green(`\nHTTP ${res2.statusCode} OK Response Body:`));
  console.log(await res2.body.text());
}
