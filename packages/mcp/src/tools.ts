import { SorobanHelper, STELLAR_CONFIG, StellarPaymentPayload, StellarX402Challenge } from '@stellar-modular/shared';
import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { request as undiciRequest } from 'undici';

export class StellarAgentTools {
  private helper: SorobanHelper;
  private keypair: Keypair;

  constructor(secretKey?: string) {
    this.helper = new SorobanHelper();
    const secret = secretKey || process.env.STELLAR_AGENT_SECRET_KEY || 'SCZEAKU3JHHO6MFEUYVDRD35367FXUP5GPF4DBXSX76DAZFHHTUYMUGG';
    this.keypair = Keypair.fromSecret(secret);
  }

  async listServices() {
    const stats = await this.helper.simulateCall('get_stats');
    return {
      network: 'stellar-testnet',
      contractId: this.helper.getContractId(),
      stats: stats || { total_services: 1, total_calls: 1 },
      services: [
        {
          id: 'weather_api',
          name: 'Global Weather Forecast Oracle',
          price: '0.01 XLM',
          url: 'http://localhost:4020/p/weather_api',
        },
        {
          id: 'deepseek_ai',
          name: 'DeepSeek LLM Inference Streamer',
          price: '0.025 XLM',
          url: 'http://localhost:4020/p/deepseek_ai',
        },
      ],
    };
  }

  async payAndCall(url: string, method: string = 'GET', body?: any) {
    // 1. Send initial probe to get 402 challenge
    const res1 = await undiciRequest(url, { method: method as any });
    if (res1.statusCode !== 402) {
      return { status: res1.statusCode, data: await res1.body.json() };
    }

    const challenge = (await res1.body.json()) as StellarX402Challenge;
    const accept = challenge.accepts[0];

    // 2. Settle on-chain via Soroban
    const server = this.helper.getServer();
    const account = await server.getAccount(this.keypair.publicKey());
    const contract = new Contract(accept.contractId);
    const nonceBytes = Buffer.from(accept.nonce, 'hex');

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: STELLAR_CONFIG.TESTNET.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'pay_per_call',
          nativeToScVal(this.keypair.publicKey(), { type: 'address' }),
          nativeToScVal(accept.serviceId, { type: 'symbol' }),
          nativeToScVal(nonceBytes, { type: 'bytes' })
        )
      )
      .setTimeout(30)
      .build();

    const prepared = await server.prepareTransaction(tx);
    prepared.sign(this.keypair);
    const sendRes = await server.sendTransaction(prepared);

    // Wait for ledger confirmation
    let getRes = await server.getTransaction(sendRes.hash);
    while (getRes.status === 'NOT_FOUND') {
      await new Promise((r) => setTimeout(r, 1000));
      getRes = await server.getTransaction(sendRes.hash);
    }

    // 3. Resend with settlement payload
    const paymentPayload: StellarPaymentPayload = {
      version: 2,
      network: 'stellar-testnet',
      contractId: accept.contractId,
      serviceId: accept.serviceId,
      nonce: accept.nonce,
      txHash: sendRes.hash,
      caller: this.keypair.publicKey(),
      mode: 'direct_call',
    };

    const res2 = await undiciRequest(url, {
      method: method as any,
      headers: {
        [STELLAR_CONFIG.HEADERS.PAYMENT]: Buffer.from(JSON.stringify(paymentPayload)).toString('base64'),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: res2.statusCode,
      txHash: sendRes.hash,
      ledger: getRes.ledger,
      data: await res2.body.text(),
    };
  }
}
