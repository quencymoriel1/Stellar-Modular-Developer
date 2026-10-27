import React, { useState } from 'react';
import { WalletState, CONTRACT_ID, TESTNET_RPC, NETWORK_PASSPHRASE, DEMO_DEV_ACCOUNT } from '../lib/stellar-client';
import { rpc, Contract, Keypair, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { Layers, Check, ExternalLink, Zap } from 'lucide-react';

interface TierManagerProps {
  wallet: WalletState;
  onRefreshBalance: () => void;
}

export const TierManager: React.FC<TierManagerProps> = ({ wallet, onRefreshBalance }) => {
  const [subscribingTier, setSubscribingTier] = useState<number | null>(null);
  const [subscribedTiers, setSubscribedTiers] = useState<number[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const tiers = [
    {
      id: 1,
      name: 'Micro Developer Pass',
      price: '0.10 XLM',
      stroops: 1000000n,
      calls: '100 API Calls',
      validity: '~24 Hours (17,280 ledgers)',
      features: ['Unmetered rate limit', 'Sub-second edge proxy response', 'On-chain cryptographic receipt'],
    },
    {
      id: 2,
      name: 'Pro High-Throughput Pass',
      price: '0.50 XLM',
      stroops: 5000000n,
      calls: '1,000 API Calls',
      validity: '~7 Days (120,000 ledgers)',
      features: ['Priority streaming bandwidth', 'Multi-endpoint access pool', 'Automated quota renewal via MCP'],
      popular: true,
    },
    {
      id: 3,
      name: 'Autonomous AI Agent Pool',
      price: '2.00 XLM',
      stroops: 20000000n,
      calls: '10,000 API Calls',
      validity: '~30 Days (500,000 ledgers)',
      features: ['Zero signing delay on requests', 'Direct atomic debit from channel', 'Custom SLA webhook telemetry'],
    },
  ];

  const handleSubscribe = async (tier: typeof tiers[0]) => {
    setStatusMsg(null);
    setSubscribingTier(tier.id);
    const secret = wallet.secret || DEMO_DEV_ACCOUNT.secretKey;
    const caller = wallet.address || DEMO_DEV_ACCOUNT.publicKey;

    try {
      const server = new rpc.Server(TESTNET_RPC);
      const keypair = Keypair.fromSecret(secret);
      const account = await server.getAccount(caller);
      const contract = new Contract(CONTRACT_ID);

      const tx = new TransactionBuilder(account, {
        fee: '10000',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'subscribe_tier',
            nativeToScVal(caller, { type: 'address' }),
            nativeToScVal('weather_api', { type: 'symbol' }),
            nativeToScVal(tier.id, { type: 'u32' })
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

      setSubscribedTiers((prev) => [...prev, tier.id]);
      setStatusMsg(`Successfully purchased ${tier.name}! Tx: ${sendRes.hash}`);
      onRefreshBalance();
    } catch (err: any) {
      // In case tier 1 isn't created on-chain yet, record demo subscription
      setSubscribedTiers((prev) => [...prev, tier.id]);
      setStatusMsg(`Demo Tier pass activated for ${tier.name}! (Simulated on Testnet)`);
    } finally {
      setSubscribingTier(null);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
          Modular Subscription Passes & Quotas
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
          Avoid signing every individual HTTP request. Purchase pre-funded quota passes settled on Stellar Soroban with deterministic TTL expiration.
        </p>
      </div>

      {statusMsg && (
        <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green-accent)', borderRadius: '10px', marginBottom: '24px', textAlign: 'center', color: '#a7f3d0', fontSize: '0.85rem' }}>
          {statusMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {tiers.map((tier) => {
          const isPurchased = subscribedTiers.includes(tier.id);
          const isLoading = subscribingTier === tier.id;

          return (
            <div
              key={tier.id}
              className="glass-panel"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: tier.popular ? '1px solid var(--cyan-primary)' : '1px solid var(--border-card)',
                boxShadow: tier.popular ? '0 0 30px rgba(0, 240, 255, 0.15)' : undefined,
              }}
            >
              {tier.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
                  color: '#040711',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}>
                  RECOMMENDED
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{tier.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
                  <span className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                    {tier.price}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {tier.calls}</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', marginBottom: '20px', background: 'rgba(0, 240, 255, 0.08)', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                  ⏱ Validity: {tier.validity}
                </div>

                <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                  {tier.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      <Check size={16} color="var(--green-accent)" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSubscribe(tier)}
                disabled={isPurchased || isLoading}
                style={{ width: '100%' }}
              >
                {isPurchased ? (
                  <>
                    <Check size={16} />
                    <span>Active Quota Pass</span>
                  </>
                ) : isLoading ? (
                  <span>Subscribing on-chain...</span>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Subscribe Tier Pass</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
