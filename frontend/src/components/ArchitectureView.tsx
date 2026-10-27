import React from 'react';
import { Check, X } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const comparisons = [
    {
      feature: 'Smart Contract Architecture',
      modu: 'No on-chain contract. Relies on external off-chain GoPlausible indexer and notes.',
      stellar: 'Native Soroban WASM smart contract with deterministic execution, events, and verifiable state.',
      advantage: true,
    },
    {
      feature: 'Replay Attack Protection',
      modu: 'Vulnerable in SQLite cache if node restarts or facilitator desynchronizes.',
      stellar: 'Cryptographic nonces persisted directly on the Stellar ledger with automatic TTL extension.',
      advantage: true,
    },
    {
      feature: 'Payment Settlement Assets',
      modu: 'Algorand ASA (10458941) or native ALGO with brittle asset opt-ins.',
      stellar: 'Native Stellar XLM and Circle USDC (SEP-0041 SAC tokens) with zero opt-in barriers.',
      advantage: true,
    },
    {
      feature: 'Modular Access Passes',
      modu: 'Strictly pay-per-call only. Every single request incurs user wallet friction.',
      stellar: 'Subscription tiers (Daily/Weekly/Monthly) and bulk quota channels natively managed on-chain.',
      advantage: true,
    },
    {
      feature: 'Autonomous AI Integration',
      modu: 'Basic prompt helper without formal RPC protocol specification.',
      stellar: 'Full Model Context Protocol (MCP) server for Claude Desktop, Cursor, Gemini, and Auto-GPTs.',
      advantage: true,
    },
    {
      feature: 'Frontend & Developer Portal',
      modu: 'Single static mock html file (test.html) with hardcoded modal terminal.',
      stellar: 'Full production React/Vite dashboard, live x402 simulator, on-chain faucet, and analytics.',
      advantage: true,
    },
  ];

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
          Architectural Teardown: <span style={{ color: 'var(--text-dim)' }}>modu</span> vs <span style={{ color: 'var(--cyan-primary)' }}>Stellar Modular Developer</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '700px', margin: '0 auto' }}>
          A senior engineering critique of the original Algorand prototype and the hardened, decentralized improvements built on Stellar & Soroban.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
              <th style={{ padding: '16px', color: 'var(--text-dim)', width: '25%' }}>Capability</th>
              <th style={{ padding: '16px', color: 'var(--rose-accent)', width: '35%' }}>Original modu (Algorand)</th>
              <th style={{ padding: '16px', color: 'var(--cyan-primary)', width: '40%' }}>Stellar Modular Developer (Soroban)</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {c.feature}
                </td>
                <td style={{ padding: '16px', color: '#ffb4b4', background: 'rgba(244, 63, 94, 0.03)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <X size={16} color="var(--rose-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{c.modu}</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#c7f9cc', background: 'rgba(0, 240, 255, 0.03)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Check size={16} color="var(--cyan-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{c.stellar}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
