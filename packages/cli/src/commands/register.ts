import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import crypto from 'crypto';
import chalk from 'chalk';
import { STELLAR_CONFIG, parseStroops, hashUrl } from '@stellar-modular/shared';

export async function registerCommand(options: any) {
  console.log(chalk.cyan.bold('\n🚀 Stellar Modular Developer — On-Chain Endpoint Registration'));
  console.log(chalk.gray('Register your API endpoint on the Soroban smart contract.\n'));

  const originUrl = options.origin || 'https://httpbin.org/get';
  const serviceId = options.id || `api_${Date.now().toString(36)}`;
  const name = options.name || 'Sample Monetized API';
  const price = options.price || '0.01';
  const asset = options.asset || 'XLM';
  const secretKey = options.secret || process.env.STELLAR_DEPLOYER_SECRET_KEY || 'SCZEAKU3JHHO6MFEUYVDRD35367FXUP5GPF4DBXSX76DAZFHHTUYMUGG';

  const keypair = Keypair.fromSecret(secretKey);
  const tokenAddress = asset === 'USDC' ? STELLAR_CONFIG.TESTNET.testnetUsdc : STELLAR_CONFIG.TESTNET.nativeSac;
  const priceStroops = parseStroops(price);
  const urlHash = hashUrl(originUrl);

  console.log(chalk.yellow(`• Service ID:   ${serviceId}`));
  console.log(chalk.yellow(`• Origin URL:   ${originUrl}`));
  console.log(chalk.yellow(`• Price:        ${price} ${asset} (${priceStroops} stroops)`));
  console.log(chalk.yellow(`• Provider:     ${keypair.publicKey()}`));
  console.log(chalk.yellow(`• Contract:     ${STELLAR_CONFIG.TESTNET.contractId}\n`));

  const server = new rpc.Server(STELLAR_CONFIG.TESTNET.rpcUrl);
  try {
    const account = await server.getAccount(keypair.publicKey());
    const contract = new Contract(STELLAR_CONFIG.TESTNET.contractId);

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: STELLAR_CONFIG.TESTNET.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'register_service',
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(serviceId, { type: 'symbol' }),
          nativeToScVal(name, { type: 'string' }),
          nativeToScVal(urlHash, { type: 'bytes' }),
          nativeToScVal(priceStroops, { type: 'i128' }),
          nativeToScVal(tokenAddress, { type: 'address' }),
          nativeToScVal(8500, { type: 'u32' }), // 85% rev-share
          nativeToScVal(originUrl, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(keypair);
    const sendRes = await server.sendTransaction(prepared);

    console.log(chalk.green(`✓ Transaction broadcasted: ${sendRes.hash}`));
    console.log(chalk.cyan(`🔗 View on Stellar Expert: ${STELLAR_CONFIG.TESTNET.explorerBase}/tx/${sendRes.hash}`));
    console.log(chalk.green(`\n🎉 Endpoint registered successfully! Proxy route: /p/${serviceId}\n`));
  } catch (err: any) {
    console.error(chalk.red(`✗ Registration failed: ${err.message || err}`));
  }
}
