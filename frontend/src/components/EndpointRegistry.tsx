import React, { useState } from 'react';
import { WalletState, CONTRACT_ID, TESTNET_RPC, NETWORK_PASSPHRASE, NATIVE_SAC, TESTNET_USDC, DEMO_DEV_ACCOUNT } from '../lib/stellar-client';
import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { PlusCircle, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface EndpointRegistryProps {
  wallet: WalletState;
  onEndpointCreated: () => void;
}

export const EndpointRegistry: React.FC<EndpointRegistryProps> = ({ wallet, onEndpointCreated }) => {
  const [originUrl, setOriginUrl] = useState('https://httpbin.org/post');
  const [serviceId, setServiceId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0.02');
  const [asset, setAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [revSplit, setRevSplit] = useState('85');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxResult(null);

    const sId = serviceId.trim() || `api_${Date.now().toString(36)}`;
    const sName = name.trim() || 'My Monetized API';
    const secret = wallet.secret || DEMO_DEV_ACCOUNT.secretKey;
    const providerKey = wallet.address || DEMO_DEV_ACCOUNT.publicKey;
    const tokenAddress = asset === 'USDC' ? TESTNET_USDC : NATIVE_SAC;
    const priceStroops = BigInt(Math.round(parseFloat(price) * 10000000));
    const splitBps = parseInt(revSplit) * 100;

    setIsSubmitting(true);
    try {
      const server = new rpc.Server(TESTNET_RPC);
      const keypair = Keypair.fromSecret(secret);
      const account = await server.getAccount(providerKey);
      const contract = new Contract(CONTRACT_ID);

      const urlHash = Array.from(crypto.getRandomValues(new Uint8Array(32)));

      const tx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'register_service',
            nativeToScVal(providerKey, { type: 'address' }),
            nativeToScVal(sId, { type: 'symbol' }),
            nativeToScVal(sName, { type: 'string' }),
            nativeToScVal(Buffer.from(urlHash), { type: 'bytes' }),
            nativeToScVal(priceStroops, { type: 'i128' }),
            nativeToScVal(tokenAddress, { type: 'address' }),
            nativeToScVal(splitBps, { type: 'u32' }),
            nativeToScVal(originUrl, { type: 'string' })
          )
        )
        .setTimeout(30)
        .build();

      const prepared = await server.prepareTransaction(tx);
      prepared.sign(keypair);
      const sendRes = await server.sendTransaction(prepared);

      let getRes = await server.getTransaction(sendRes.hash);
      while (getRes.status === 'NOT_FOUND') {
        await new Promise((r) => setTimeout(r, 1000));
        getRes = await server.getTransaction(sendRes.hash);
      }

      setTxResult({
        serviceId: sId,
        txHash: sendRes.hash,
        ledger: getRes.ledger,
      });
      onEndpointCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit registration transaction to Soroban');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <PlusCircle size={22} color="var(--cyan-primary)" />
        <h2 className="font-display" style={{ fontSize: '1.4rem' }}>Monetize Any HTTP API on Stellar</h2>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
        Wrap any private or third-party HTTP endpoint into an on-chain pay-per-request gateway. Settled in native XLM or USDC with zero payment code on your server.
      </p>

      {errorMsg && (
        <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--rose-accent)', borderRadius: '8px', marginBottom: '20px', color: '#ffb4b4', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {txResult && (
        <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green-accent)', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-accent)', fontWeight: 600, marginBottom: '8px' }}>
            <CheckCircle size={20} />
            <span>Endpoint Deployed to Soroban Contract Successfully!</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '12px' }}>
            Proxy URL:{' '}
            <strong className="font-mono" style={{ color: 'var(--cyan-primary)' }}>
              https://stellar-modular.dev/p/{txResult.serviceId}
            </strong>
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txResult.txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            Inspect Ledger Entry on Stellar Expert <ExternalLink size={12} />
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
            Origin URL to Monetize
          </label>
          <input
            className="input-field"
            type="url"
            value={originUrl}
            onChange={(e) => setOriginUrl(e.target.value)}
            placeholder="https://api.yourdomain.com/v1/resource"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Service Slug (ID)
            </label>
            <input
              className="input-field"
              type="text"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder="e.g. gpt4_stream or oracle_v1"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Display Name
            </label>
            <input
              className="input-field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Realtime Neural Inference"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Settlement Asset
            </label>
            <select
              className="input-field"
              value={asset}
              onChange={(e) => setAsset(e.target.value as any)}
            >
              <option value="XLM">Native Stellar XLM</option>
              <option value="USDC">Circle USDC on Stellar</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Price per Request
            </label>
            <input
              className="input-field"
              type="number"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Provider Rev-Split (%)
            </label>
            <input
              className="input-field"
              type="number"
              min="50"
              max="100"
              value={revSplit}
              onChange={(e) => setRevSplit(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={isSubmitting}
          >
            <Sparkles size={18} />
            <span>{isSubmitting ? 'Registering on Soroban Testnet...' : 'Register API on Stellar Testnet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
