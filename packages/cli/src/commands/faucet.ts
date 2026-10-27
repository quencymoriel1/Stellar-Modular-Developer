import { Keypair } from '@stellar/stellar-sdk';
import { request as undiciRequest } from 'undici';
import chalk from 'chalk';
import { STELLAR_CONFIG } from '@stellar-modular/shared';

export async function faucetCommand(targetAddress?: string) {
  let address = targetAddress;
  let secret: string | undefined;

  if (!address) {
    const pair = Keypair.random();
    address = pair.publicKey();
    secret = pair.secret();
    console.log(chalk.cyan(`\n🔑 Generated fresh Testnet Keypair:`));
    console.log(chalk.yellow(`• Public: ${address}`));
    console.log(chalk.yellow(`• Secret: ${secret}\n`));
  }

  console.log(chalk.blue(`Requesting 10,000 test XLM from Friendbot for: ${address}...`));
  try {
    const res = await undiciRequest(`https://friendbot.stellar.org?addr=${address}`);
    if (res.statusCode === 200) {
      console.log(chalk.green(`✓ Successfully funded account on Stellar Testnet!`));
      console.log(chalk.cyan(`🔗 View account: ${STELLAR_CONFIG.TESTNET.explorerBase}/account/${address}`));
    } else {
      console.log(chalk.yellow(`Friendbot returned code ${res.statusCode}. Account might already exist.`));
    }
  } catch (err: any) {
    console.error(chalk.red(`Failed to reach friendbot: ${err.message}`));
  }
}
