import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ApiPlayground } from './components/ApiPlayground';
import { EndpointRegistry } from './components/EndpointRegistry';
import { TierManager } from './components/TierManager';
import { AnalyticsView } from './components/AnalyticsView';
import { CodeSnippets } from './components/CodeSnippets';
import { ArchitectureView } from './components/ArchitectureView';
import { WalletModal } from './components/WalletModal';
import { FaucetModal } from './components/FaucetModal';
import {
  WalletState,
  DEMO_DEV_ACCOUNT,
  fetchAccountBalances,
} from './lib/stellar-client';
import { Terminal, PlusCircle, Layers, BarChart3, Code2, ShieldAlert, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'register' | 'tiers' | 'analytics' | 'sdk' | 'architecture'>('playground');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    address: DEMO_DEV_ACCOUNT.publicKey,
    secret: DEMO_DEV_ACCOUNT.secretKey,
    xlmBalance: '10000.00',
    usdcBalance: '0.00',
    isConnected: true,
    walletType: 'dev-key',
  });

  const refreshBalance = async () => {
    if (wallet.address) {
      const { xlm, usdc } = await fetchAccountBalances(wallet.address);
      setWallet((prev) => ({ ...prev, xlmBalance: xlm, usdcBalance: usdc }));
    }
  };

  useEffect(() => {
    refreshBalance();
    const interval = setInterval(refreshBalance, 15000);
    return () => clearInterval(interval);
  }, [wallet.address]);

  const handleConnectDev = () => {
    setWallet({
      address: DEMO_DEV_ACCOUNT.publicKey,
      secret: DEMO_DEV_ACCOUNT.secretKey,
      xlmBalance: '10000.00',
      usdcBalance: '0.00',
      isConnected: true,
      walletType: 'dev-key',
    });
    refreshBalance();
  };

  const handleConnectCustom = async (secret: string) => {
    try {
      const { Keypair } = await import('@stellar/stellar-sdk');
      const kp = Keypair.fromSecret(secret);
      setWallet({
        address: kp.publicKey(),
        secret,
        xlmBalance: '0.00',
        usdcBalance: '0.00',
        isConnected: true,
        walletType: 'dev-key',
      });
      refreshBalance();
    } catch {
      alert('Invalid Stellar secret key');
    }
  };

  const handleDisconnect = () => {
    setWallet({
      address: null,
      secret: null,
      xlmBalance: '0.00',
      usdcBalance: '0.00',
      isConnected: false,
      walletType: null,
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        wallet={wallet}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenFaucetModal={() => setIsFaucetModalOpen(true)}
      />

      {/* Hero Banner */}
      <section style={{
        padding: '50px 0 30px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', marginBottom: '18px' }}>
            <Sparkles size={14} color="var(--cyan-primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)', fontWeight: 600 }}>
              The Official x402 Micropayment Standard for Stellar Soroban
            </span>
          </div>

          <h1 className="font-display" style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            maxWidth: '900px',
            margin: '0 auto 16px',
          }}>
            Turn Any HTTP API Into a <span style={{ color: 'var(--cyan-primary)' }}>Pay-Per-Request</span> Endpoint on Stellar
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            maxWidth: '720px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}>
            Issue instant cryptographic 402 challenges settled on Stellar Testnet in native XLM or Circle USDC. Zero payment code required on your origin servers.
          </p>

          {/* Quick Navigation Tabs */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(16, 21, 33, 0.9)',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { id: 'playground', label: 'Live Gateway', icon: Terminal },
              { id: 'register', label: 'Monetize API', icon: PlusCircle },
              { id: 'tiers', label: 'Subscription Passes', icon: Layers },
              { id: 'analytics', label: 'Telemetry', icon: BarChart3 },
              { id: 'sdk', label: 'Developer SDK', icon: Code2 },
              { id: 'architecture', label: 'Architecture Comparison', icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, #00f0ff 0%, #0088ff 100%)' : 'transparent',
                    color: isActive ? '#050811' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {activeTab === 'playground' && (
          <ApiPlayground wallet={wallet} onRefreshBalance={refreshBalance} />
        )}
        {activeTab === 'register' && (
          <EndpointRegistry wallet={wallet} onEndpointCreated={() => { refreshBalance(); setActiveTab('playground'); }} />
        )}
        {activeTab === 'tiers' && (
          <TierManager wallet={wallet} onRefreshBalance={refreshBalance} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
        {activeTab === 'sdk' && (
          <CodeSnippets />
        )}
        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px 0',
        background: 'rgba(5, 7, 11, 0.95)',
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            Built on <strong>Stellar & Soroban</strong> — Apache-2.0 License
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <a href="https://github.com/quencymoriel1/Stellar-Modular-Developer" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              GitHub Repository
            </a>
            <a href="https://stellar.expert/explorer/testnet" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Stellar Expert Testnet
            </a>
            <a href="https://soroban.stellar.org/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Soroban Docs
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={wallet}
        onConnectDevAccount={handleConnectDev}
        onConnectCustomKey={handleConnectCustom}
        onDisconnect={handleDisconnect}
      />

      <FaucetModal
        isOpen={isFaucetModalOpen}
        onClose={() => setIsFaucetModalOpen(false)}
        defaultAddress={wallet.address}
        onFunded={refreshBalance}
      />
    </div>
  );
};
