import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal, scValToNative, Address } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from './constants';
import { ServiceDefinition, StellarPaymentReceipt } from './types';

export class SorobanHelper {
  private server: rpc.Server;
  private networkPassphrase: string;
  private contractId: string;

  constructor(
    rpcUrl: string = STELLAR_CONFIG.TESTNET.rpcUrl,
    networkPassphrase: string = STELLAR_CONFIG.TESTNET.networkPassphrase,
    contractId: string = STELLAR_CONFIG.TESTNET.contractId
  ) {
    this.server = new rpc.Server(rpcUrl);
    this.networkPassphrase = networkPassphrase;
    this.contractId = contractId;
  }

  getContractId(): string {
    return this.contractId;
  }

  getServer(): rpc.Server {
    return this.server;
  }

  async verifyTransaction(txHash: string): Promise<{ success: boolean; ledger?: number; createdAt?: string }> {
    try {
      const tx = await this.server.getTransaction(txHash);
      if (tx.status === 'SUCCESS') {
        return {
          success: true,
          ledger: tx.ledger,
          createdAt: tx.createdAt ? new Date(Number(tx.createdAt) * 1000).toISOString() : new Date().toISOString(),
        };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  async simulateCall(method: string, ...args: any[]): Promise<any> {
    const contract = new Contract(this.contractId);
    // Use dummy account for read-only simulation
    const dummyKeypair = Keypair.random();
    const scVals = args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('C') && arg.length === 56) {
        return nativeToScVal(arg, { type: 'address' });
      }
      if (typeof arg === 'string' && arg.startsWith('G') && arg.length === 56) {
        return nativeToScVal(arg, { type: 'address' });
      }
      if (typeof arg === 'bigint') {
        return nativeToScVal(arg, { type: 'i128' });
      }
      if (typeof arg === 'number') {
        return nativeToScVal(arg, { type: 'u32' });
      }
      if (Buffer.isBuffer(arg)) {
        return nativeToScVal(arg, { type: 'bytes' });
      }
      return nativeToScVal(arg);
    });

    try {
      const sim = await this.server.simulateTransaction(
        new TransactionBuilder(
          {
            accountId: () => dummyKeypair.publicKey(),
            sequenceNumber: () => '1',
            incrementSequenceNumber: () => {},
          } as any,
          { fee: '100', networkPassphrase: this.networkPassphrase }
        )
          .addOperation(contract.call(method, ...scVals))
          .setTimeout(30)
          .build()
      );

      if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
        return scValToNative(sim.result.retval);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getService(serviceId: string): Promise<ServiceDefinition | null> {
    const res = await this.simulateCall('get_service', serviceId);
    if (!res) return null;
    return {
      serviceId,
      name: res.name || serviceId,
      originUrl: res.metadata_uri || '',
      priceStroops: BigInt(res.price_stroops || 0),
      tokenAddress: res.token || STELLAR_CONFIG.TESTNET.nativeSac,
      revSplitBps: Number(res.rev_split_bps || 0),
      metadataUri: res.metadata_uri || '',
      active: Boolean(res.active),
      provider: res.provider || '',
      totalCalls: BigInt(res.total_calls || 0),
      totalVolume: BigInt(res.total_volume || 0),
      createdAt: Number(res.created_at || 0),
    };
  }

  async checkAccess(caller: string, serviceId: string): Promise<boolean> {
    const res = await this.simulateCall('check_access', caller, serviceId);
    return Boolean(res);
  }
}
