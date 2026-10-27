import React from 'react';
import { WalletState, CONTRACT_ID } from '../lib/stellar-client';
import { Wallet, Droplets, ExternalLink, Activity } from 'lucide-react';

interface NavbarProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
  onOpenFaucetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ wallet, onOpenWalletModal, onOpenFaucetModal }) => {
  return (
    <header style={{
      borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
          }}>
            <Activity size={22} color="#050811" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-display" style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
                STELLAR <span style={{ color: 'var(--cyan-primary)' }}>MODULAR</span>
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>v2.0 x402</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span className="dot-live"></span>
              <span>Testnet Protocol 29/30</span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--cyan-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                Contract: {CONTRACT_ID.slice(0, 4)}...{CONTRACT_ID.slice(-4)} <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpenFaucetModal} title="Get 10,000 Testnet XLM">
            <Droplets size={15} color="var(--cyan-primary)" />
            <span>Testnet Faucet</span>
          </button>

          {wallet.isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.85rem',
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Balance: </span>
                  <strong style={{ color: 'var(--cyan-primary)' }}>{wallet.xlmBalance} XLM</strong>
                </div>
                <div style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--cyan-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}>
                  {wallet.address?.slice(0, 4)}...{wallet.address?.slice(-4)}
                </div>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={onOpenWalletModal}>
                <Wallet size={15} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenWalletModal}>
              <Wallet size={15} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
