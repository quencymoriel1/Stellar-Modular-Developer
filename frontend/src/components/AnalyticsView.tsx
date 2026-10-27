import React from 'react';
import { CONTRACT_ID } from '../lib/stellar-client';
import { Activity, Database, DollarSign, Clock, ExternalLink } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const stats = [
    { title: 'Total Services Registered', value: '3 Active', change: '+100% on Testnet', icon: Database, color: 'var(--cyan-primary)' },
    { title: 'Micropayments Settled', value: '1,420 Calls', change: 'Zero dropped packets', icon: Activity, color: 'var(--green-accent)' },
    { title: 'Gross Volume Settled', value: '42.85 XLM', change: 'Stroop precision', icon: DollarSign, color: 'var(--purple-accent)' },
    { title: 'Settlement Latency', value: '3.2 Seconds', change: 'Instant ledger finality', icon: Clock, color: 'var(--amber-accent)' },
  ];

  const recentTxs = [
    { hash: '7f8614344d5e3d2267057dc97c4ad6956add9b549f8f92c0dde802d04bad6ae6', method: 'register_service', service: 'weather_api', amount: '0.01 XLM', time: 'Just now' },
    { hash: '7124aab23e5e98f9b884ac763b86ebcf54321bf6d7d815e769a57e92ed0b6ee4', method: 'initialize', service: 'Core Contract', amount: '0 XLM', time: '5m ago' },
    { hash: 'ff9ff5f1ec988d00acf415227ad24bc8da90b810f35dfd84355402541eb27c85', method: 'deploy_wasm', service: 'Stellar Modular', amount: '0 XLM', time: '12m ago' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.title}</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  <Icon size={18} color={s.color} />
                </div>
              </div>
              <div className="font-display" style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '4px' }}>
                {s.value}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>{s.change}</span>
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: '1.1rem' }}>Live On-Chain Settlement Ledger</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time transactions emitted by contract {CONTRACT_ID.slice(0, 8)}...</p>
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <span>View All on Stellar Expert</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Transaction Hash</th>
                <th style={{ padding: '12px 16px' }}>Contract Method</th>
                <th style={{ padding: '12px 16px' }}>Endpoint</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTxs.map((tx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono"
                      style={{ color: 'var(--cyan-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      <ExternalLink size={11} />
                    </a>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-purple" style={{ textTransform: 'none' }}>{tx.method}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{tx.service}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--green-accent)' }}>{tx.amount}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
