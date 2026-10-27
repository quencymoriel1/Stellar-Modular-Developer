import React, { useState } from 'react';
import { WalletState, submitMicropayment, CONTRACT_ID, DEMO_DEV_ACCOUNT } from '../lib/stellar-client';
import { Play, CheckCircle2, AlertCircle, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';

interface ApiPlaygroundProps {
  wallet: WalletState;
  onRefreshBalance: () => void;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({ wallet, onRefreshBalance }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'weather_api' | 'deepseek_ai' | 'crypto_rates'>('weather_api');
  const [stage, setStage] = useState<'idle' | 'challenging' | 'challenged' | 'paying' | 'settled'>('idle');
  const [challengeData, setChallengeData] = useState<any>(null);
  const [settlementResult, setSettlementResult] = useState<any>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const endpoints = {
    weather_api: {
      name: 'Global Weather Forecast Oracle',
      price: '0.01 XLM',
      stroops: '100000',
      description: 'High-precision satellite meteorological intelligence and barometric trends.',
      mockResponse: {
        location: 'Stellar Station 01 — Earth Orbit',
        temperature_c: 21.4,
        humidity: '48%',
        pressure_hpa: 1013.25,
        source: 'DePIN Atmospheric Sensors v2',
        settled_on_chain: true,
      },
    },
    deepseek_ai: {
      name: 'DeepSeek LLM Inference Streamer',
      price: '0.025 XLM',
      stroops: '250000',
      description: 'Ultra-fast decentralized reasoning model inference on token streaming.',
      mockResponse: {
        prompt: 'Analyze Soroban atomic state isolation',
        completion: 'Soroban smart contracts execute in isolated WebAssembly instances with deterministic resource meters (CPU/Memory). Replay attacks are mitigated at ledger sequence level.',
        tokens_generated: 48,
        cost_stroops: 250000,
      },
    },
    crypto_rates: {
      name: 'Realtime Multi-Chain DEX Ticker',
      price: '0.005 XLM',
      stroops: '50000',
      description: 'Decentralized exchange liquidity aggregate across Stellar SDEX & AMMs.',
      mockResponse: {
        pairs: [
          { pair: 'XLM/USDC', rate: '0.1248', change_24h: '+4.2%' },
          { pair: 'AQUA/XLM', rate: '0.0042', change_24h: '-1.1%' },
        ],
        timestamp: new Date().toISOString(),
      },
    },
  };

  const currentEp = endpoints[selectedEndpoint];

  const handleSendProbe = () => {
    setErrorMsg(null);
    setStage('challenging');
    setSettlementResult(null);
    setResponseData(null);

    setTimeout(() => {
      // Create authentic 402 challenge
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const challenge = {
        x402Version: 2,
        title: `Payment Required — ${currentEp.name}`,
        serviceId: selectedEndpoint,
        accepts: [
          {
            scheme: 'exact',
            network: 'stellar-testnet',
            contractId: CONTRACT_ID,
            serviceId: selectedEndpoint,
            priceStroops: currentEp.stroops,
            priceFormatted: currentEp.price,
            assetCode: 'XLM',
            nonce,
            resource: `https://stellar-modular.dev/p/${selectedEndpoint}`,
          },
        ],
      };
      setChallengeData(challenge);
      setStage('challenged');
    }, 450);
  };

  const handlePayAndSettle = async () => {
    if (!challengeData) return;
    setErrorMsg(null);
    setStage('paying');

    const nonce = challengeData.accepts[0].nonce;
    const secret = wallet.secret || DEMO_DEV_ACCOUNT.secretKey;

    const res = await submitMicropayment(selectedEndpoint, nonce, secret);
    if (!res.success) {
      setErrorMsg(res.error || 'Payment transaction failed on Testnet');
      setStage('challenged');
      return;
    }

    setSettlementResult(res);
    setStage('settled');
    setResponseData(currentEp.mockResponse);
    onRefreshBalance();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Left panel: Endpoint config and probe */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--cyan-primary)" />
            <h3 className="font-display" style={{ fontSize: '1.1rem' }}>Interactive x402 Gateway</h3>
          </div>
          <span className="badge badge-purple">RFC HTTP 402</span>
        </div>

        {/* Endpoint Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Select Protected Endpoint
          </label>
          <div style={{ display: 'grid', gap: '10px' }}>
            {(Object.keys(endpoints) as (keyof typeof endpoints)[]).map((key) => {
              const ep = endpoints[key];
              const isSelected = selectedEndpoint === key;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedEndpoint(key);
                    setStage('idle');
                    setChallengeData(null);
                    setSettlementResult(null);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--cyan-primary)' : 'rgba(255, 255, 255, 0.08)'}`,
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{ep.name}</strong>
                    <span className="badge badge-cyan">{ep.price}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ep.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Trigger */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSendProbe}
            disabled={stage === 'challenging' || stage === 'paying'}
          >
            <Play size={16} />
            <span>{stage === 'challenging' ? 'Sending GET Probe...' : 'Step 1: Send Request Probe'}</span>
          </button>
        </div>

        {stage !== 'idle' && (
          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>REQUEST LOG:</div>
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)' }}>
              GET /p/{selectedEndpoint} HTTP/1.1
            </div>
            <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Host: stellar-modular.dev | Accept: application/json
            </div>
          </div>
        )}
      </div>

      {/* Right panel: Live Challenge & Settlement Viewer */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem' }}>Protocol Execution Stream</h3>
          {stage === 'settled' && <span className="badge badge-green">200 OK — Settled</span>}
          {stage === 'challenged' && <span className="badge badge-cyan">402 Payment Required</span>}
        </div>

        {errorMsg && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--rose-accent)', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} color="var(--rose-accent)" />
            <span style={{ fontSize: '0.85rem', color: '#ffb4b4' }}>{errorMsg}</span>
          </div>
        )}

        {stage === 'idle' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <Terminal size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>Click "Send Request Probe" to initiate the HTTP 402 payment challenge loop.</p>
          </div>
        )}

        {stage === 'challenged' && challengeData && (
          <div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--amber-accent)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--amber-accent)', fontWeight: 600 }}>
                <AlertCircle size={18} />
                <span>HTTP/1.1 402 Payment Required</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                The proxy intercepted your request. To stream the API response, sign an on-chain micropayment of <strong>{challengeData.accepts[0].priceFormatted}</strong> on Stellar Testnet.
              </p>
              <div className="font-mono" style={{ fontSize: '0.75rem', background: '#05070d', padding: '10px', borderRadius: '6px', color: '#cbd5e1' }}>
                <div>Nonce: {challengeData.accepts[0].nonce.slice(0, 16)}...</div>
                <div>Contract: {CONTRACT_ID.slice(0, 10)}...</div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handlePayAndSettle}
            >
              <ShieldCheck size={16} />
              <span>Step 2: Sign & Settle on Stellar Testnet ({currentEp.price})</span>
            </button>
          </div>
        )}

        {stage === 'paying' && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div className="dot-live" style={{ width: '16px', height: '16px', margin: '0 auto 16px' }}></div>
            <h4 style={{ marginBottom: '8px' }}>Broadcasting to Stellar Testnet...</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Submitting Soroban transaction `pay_per_call` to contract {CONTRACT_ID.slice(0, 8)}...
            </p>
          </div>
        )}

        {stage === 'settled' && settlementResult && (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--green-accent)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--green-accent)', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>Payment Confirmed on Stellar Ledger #{settlementResult.ledger}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                TxHash: <span className="font-mono" style={{ color: 'var(--cyan-primary)' }}>{settlementResult.txHash}</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${settlementResult.txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Inspect Settlement on Stellar Expert <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '6px' }}>VERBATIM API RESPONSE (200 OK):</div>
              <pre
                className="font-mono"
                style={{
                  background: '#04060a',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a7f3d0',
                }}
              >
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
