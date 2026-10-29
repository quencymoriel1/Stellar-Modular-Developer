import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { CONTRACT_ID } from '../lib/stellar-client';

export const CodeSnippets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ts' | 'python' | 'curl' | 'mcp'>('ts');
  const [copied, setCopied] = useState(false);

  const snippets = {
    ts: `import { request } from 'undici';
import { Keypair, Contract, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';

const PROXY_URL = 'https://stellar-modular.dev/p/weather_api';
const SECRET_KEY = process.env.STELLAR_SECRET_KEY!;

async function fetchPaidApi() {
  // 1. Probe for HTTP 402 Challenge
  const res1 = await request(PROXY_URL);
  if (res1.statusCode !== 402) return res1.body.json();

  const challenge = await res1.body.json();
  const accept = challenge.accepts[0];

  // 2. Settle Micropayment on Stellar Soroban
  const keypair = Keypair.fromSecret(SECRET_KEY);
  // Sign and submit pay_per_call(caller, serviceId, nonce) ...
  const txHash = '7f861434...'; 

  // 3. Resend with X-Stellar-Payment settlement proof
  const res2 = await request(PROXY_URL, {
    headers: {
      'x-stellar-payment': Buffer.from(JSON.stringify({
        version: 2,
        network: 'stellar-testnet',
        contractId: '${CONTRACT_ID}',
        serviceId: 'weather_api',
        nonce: accept.nonce,
        txHash,
        caller: keypair.publicKey(),
        mode: 'direct_call'
      })).toString('base64')
    }
  });

  console.log('Payment Receipt:', res2.headers['x-stellar-payment-response']);
  return res2.body.json();
}`,
    python: `import requests, json, base64
from stellar_sdk import Keypair, SorobanServer, TransactionBuilder

PROXY_URL = "https://stellar-modular.dev/p/weather_api"

# 1. Probe x402 endpoint
r1 = requests.get(PROXY_URL)
if r1.status_code == 402:
    challenge = r1.json()
    nonce = challenge["accepts"][0]["nonce"]
    
    # 2. Settle on Stellar Testnet via Soroban
    # Submit pay_per_call transaction...
    tx_hash = "7f861434..."
    
    # 3. Stream verbatim response
    payload = {
        "version": 2,
        "contractId": "${CONTRACT_ID}",
        "serviceId": "weather_api",
        "nonce": nonce,
        "txHash": tx_hash,
        "mode": "direct_call"
    }
    r2 = requests.get(PROXY_URL, headers={
        "x-stellar-payment": base64.b64encode(json.dumps(payload).encode()).decode()
    })
    print("Response:", r2.json())`,
    curl: `# 1. Probe endpoint and inspect 402 challenge
curl -i https://stellar-modular.dev/p/weather_api

# 2. Request with Stellar Payment Settlement Proof
curl -X GET https://stellar-modular.dev/p/weather_api \\
  -H "x-stellar-payment: eyJ2ZXJzaW9uIjoyLCJjb250cmFjdElkIjoiQ0FRTlVKN0NOQ1JEU1ZURTY...\"`,
    mcp: `{
  "mcpServers": {
    "stellar-modular": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": {
        "STELLAR_AGENT_SECRET_KEY": "S...YOUR_STELLAR_TESTNET_SECRET_KEY...",
        "STELLAR_RPC_URL": "https://soroban-testnet.stellar.org"
      }
    }
  }
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={18} color="var(--cyan-primary)" />
          <h3 className="font-display" style={{ fontSize: '1.1rem' }}>Developer Integration SDK</h3>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
          {copied ? <Check size={14} color="var(--green-accent)" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        {(['ts', 'python', 'curl', 'mcp'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
              color: activeTab === tab ? 'var(--cyan-primary)' : 'var(--text-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <pre
        className="font-mono"
        style={{
          background: '#04060a',
          padding: '18px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          overflowX: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          lineHeight: '1.6',
        }}
      >
        {snippets[activeTab]}
      </pre>
    </div>
  );
};
