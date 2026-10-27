import React, { useState } from 'react';
import { requestFriendbotFunding, DEMO_DEV_ACCOUNT } from '../lib/stellar-client';
import { Droplets, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAddress?: string | null;
  onFunded: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  defaultAddress,
  onFunded,
}) => {
  const [address, setAddress] = useState(defaultAddress || DEMO_DEV_ACCOUNT.publicKey);
  const [isFunding, setIsFunding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFund = async () => {
    setIsFunding(true);
    setErrorMsg(null);
    setSuccess(false);

    const ok = await requestFriendbotFunding(address.trim());
    setIsFunding(false);

    if (ok) {
      setSuccess(true);
      onFunded();
    } else {
      setErrorMsg('Friendbot could not fund account. It may already be funded or ratelimited.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplets size={22} color="var(--cyan-primary)" />
            <h3 className="font-display" style={{ fontSize: '1.2rem' }}>Stellar Testnet Friendbot Faucet</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Fund any Stellar Testnet public key with <strong>10,000 free test XLM</strong> to execute Soroban smart contract micropayments.
        </p>

        {success && (
          <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--green-accent)', borderRadius: '8px', marginBottom: '18px', color: '#a7f3d0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="var(--green-accent)" />
            <span>Success! 10,000 XLM credited to your account.</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--rose-accent)', borderRadius: '8px', marginBottom: '18px', color: '#ffb4b4', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="var(--rose-accent)" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Stellar Public Key (G...)
          </label>
          <input
            type="text"
            className="input-field"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="GCBZC5TOFMEZ6WXL5TDXAMKP7J5RIVHKYBMPHOYX6WR55UXBCLASC4DY"
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px' }}
          onClick={handleFund}
          disabled={isFunding || !address.trim()}
        >
          <Droplets size={16} />
          <span>{isFunding ? 'Requesting Test XLM...' : 'Request 10,000 Test XLM'}</span>
        </button>
      </div>
    </div>
  );
};
