import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';

export interface WalletState {
  address: string | null;
  secret: string | null;
  xlmBalance: string;
  usdcBalance: string;
  isConnected: boolean;
  walletType: 'dev-key' | 'freighter' | 'albedo' | null;
}

export const CONTRACT_ID = 'CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND';
export const TESTNET_RPC = 'https://soroban-testnet.stellar.org';
export const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const NATIVE_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const TESTNET_USDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUIE3USSTHZX5COQN4';

function getDemoDevAccount(): { publicKey: string; secretKey: string } {
  try {
    const storageKey = 'stellar_modular_dev_key';
    const existing = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (existing) {
      const kp = Keypair.fromSecret(existing);
      return { publicKey: kp.publicKey(), secretKey: kp.secret() };
    }
    const kp = Keypair.random();
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, kp.secret());
    }
    return { publicKey: kp.publicKey(), secretKey: kp.secret() };
  } catch {
    const kp = Keypair.random();
    return { publicKey: kp.publicKey(), secretKey: kp.secret() };
  }
}

// Ephemeral browser-scoped developer account for 1-click testnet testing
export const DEMO_DEV_ACCOUNT = getDemoDevAccount();

export async function fetchAccountBalances(address: string): Promise<{ xlm: string; usdc: string }> {
  try {
    const res = await fetch(`${TESTNET_HORIZON}/accounts/${address}`);
    if (!res.ok) return { xlm: '0.00', usdc: '0.00' };
    const data = await res.json();
    let xlm = '0.00';
    let usdc = '0.00';
    for (const b of data.balances) {
      if (b.asset_type === 'native') {
        xlm = Number(b.balance).toFixed(2);
      } else if (b.asset_code === 'USDC') {
        usdc = Number(b.balance).toFixed(2);
      }
    }
    return { xlm, usdc };
  } catch {
    return { xlm: '0.00', usdc: '0.00' };
  }
}

export async function requestFriendbotFunding(address: string): Promise<boolean> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitMicropayment(
  serviceId: string,
  nonceHex: string,
  payerSecret: string
): Promise<{ success: boolean; txHash?: string; ledger?: number; error?: string }> {
  try {
    const keypair = Keypair.fromSecret(payerSecret);
    const server = new rpc.Server(TESTNET_RPC);
    const account = await server.getAccount(keypair.publicKey());
    const contract = new Contract(CONTRACT_ID);
    const nonceBytes = Buffer.from(nonceHex, 'hex');

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          'pay_per_call',
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(serviceId, { type: 'symbol' }),
          nativeToScVal(nonceBytes, { type: 'bytes' })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(keypair);
    const sendRes = await server.sendTransaction(prepared);

    if (sendRes.status === 'ERROR') {
      return { success: false, error: 'Transaction simulation or submission error' };
    }

    let getRes = await server.getTransaction(sendRes.hash);
    let attempts = 0;
    while (getRes.status === 'NOT_FOUND' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 1000));
      getRes = await server.getTransaction(sendRes.hash);
      attempts++;
    }

    if (getRes.status === 'SUCCESS') {
      return { success: true, txHash: sendRes.hash, ledger: getRes.ledger };
    }
    return { success: false, error: `Transaction failed with status: ${getRes.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment execution failed' };
  }
}
