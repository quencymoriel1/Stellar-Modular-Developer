import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import crypto from 'crypto';

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
const CONTRACT_ID = process.env.STELLAR_MODULAR_CONTRACT_ID || 'CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND';
const SECRET_KEY = process.env.STELLAR_DEPLOYER_SECRET_KEY;
if (!SECRET_KEY) {
  console.error('Error: STELLAR_DEPLOYER_SECRET_KEY environment variable is required.');
  process.exit(1);
}
const NATIVE_SAC = process.env.STELLAR_NATIVE_SAC_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

async function seed() {
  const server = new rpc.Server(RPC_URL);
  const keypair = Keypair.fromSecret(SECRET_KEY);
  console.log(`Seeding endpoints with deployer: ${keypair.publicKey()}`);

  const endpoints = [
    {
      id: 'weather_api',
      name: 'Global Weather Forecast Oracle',
      origin: 'https://httpbin.org/get',
      price: 100000n, // 0.01 XLM
      revSplit: 8000,
      metadata: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    },
    {
      id: 'deepseek_ai',
      name: 'DeepSeek LLM Inference Streamer',
      origin: 'https://httpbin.org/post',
      price: 250000n, // 0.025 XLM
      revSplit: 9000,
      metadata: 'ipfs://bafybeid2x4wug3y6cve56vhuk2jfgptv46omz7cvyv753o5q5lskq4674y',
    },
    {
      id: 'crypto_rates',
      name: 'Realtime Multi-Chain DEX Ticker',
      origin: 'https://httpbin.org/json',
      price: 50000n, // 0.005 XLM
      revSplit: 8500,
      metadata: 'ipfs://bafybeia7u5dln2z2b6y3m4oemr4whqomc25b3h5bfe6pvdndv4hndylytq',
    }
  ];

  for (const ep of endpoints) {
    try {
      const account = await server.getAccount(keypair.publicKey());
      const contract = new Contract(CONTRACT_ID);
      const urlHash = crypto.createHash('sha256').update(ep.origin).digest();

      const tx = new TransactionBuilder(account, { fee: '10000', networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(contract.call('register_service',
          nativeToScVal(keypair.publicKey(), { type: 'address' }),
          nativeToScVal(ep.id, { type: 'symbol' }),
          nativeToScVal(ep.name, { type: 'string' }),
          nativeToScVal(urlHash, { type: 'bytes' }),
          nativeToScVal(ep.price, { type: 'i128' }),
          nativeToScVal(NATIVE_SAC, { type: 'address' }),
          nativeToScVal(ep.revSplit, { type: 'u32' }),
          nativeToScVal(ep.metadata, { type: 'string' })
        ))
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(keypair);
      const res = await server.sendTransaction(prepared);
      console.log(`Registered ${ep.id}: ${res.hash}`);
    } catch (err: any) {
      console.log(`Endpoint ${ep.id} registration note:`, err.message || err);
    }
  }
}

seed().catch(console.error);
