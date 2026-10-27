import React, { useState } from 'react';
import { WalletState, DEMO_DEV_ACCOUNT } from '../lib/stellar-client';
import { Wallet, Key, ShieldCheck, X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onConnectDevAccount: () => void;
  onConnectCustomKey: (secret: string) => void;
  onDisconnect: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnectDevAccount,
  onConnectCustomKey,
  onDisconnect,
}) => {
  const [customKey, setCustomKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--cyan-primary)" />
            <h3 className="font-display" style={{ fontSize: '1.2rem' }}>Connect Stellar Wallet</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {wallet.isConnected ? (
          <div>
            <div style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CONNECTED ADDRESS:</div>
              <div className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--cyan-primary)', wordBreak: 'break-all' }}>
                {wallet.address}
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.9rem', display: 'flex', gap: '16px' }}>
                <span>XLM: <strong>{wallet.xlmBalance}</strong></span>
                <span>USDC: <strong>{wallet.usdcBalance}</strong></span>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { onDisconnect(); onClose(); }}>
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {/* 1-Click Funded Dev Account */}
            <div
              onClick={() => { onConnectDevAccount(); onClose(); }}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--cyan-primary)',
                background: 'rgba(0, 240, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <ShieldCheck size={24} color="var(--cyan-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Funded Testnet Deployer Account (1-Click)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pre-loaded with 10,000 XLM for instant playground execution & deployment.
                </div>
              </div>
            </div>

            {/* Custom Secret Key */}
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Or Enter Custom Stellar Secret Key (S...)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (customKey.trim()) {
                      onConnectCustomKey(customKey.trim());
                      onClose();
                    }
                  }}
                >
                  <Key size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
