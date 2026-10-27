# Vercel Deployment Guide — Stellar Modular Developer

This document provides instructions for deploying the **Stellar Modular Developer** frontend dashboard and x402 edge gateway on **Vercel**.

---

## 1. Fast Deploy via GitHub Integration

1. Go to the [Vercel Dashboard](https://vercel.com/new).
2. Click **Add New Project** and import:
   ```text
   https://github.com/quencymoriel1/Stellar-Modular-Developer
   ```
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or `frontend`)
   - **Build Command**: `cd frontend && npm install && npm run build` (or `npm run build` if Root is `frontend`)
   - **Output Directory**: `frontend/dist` (or `dist` if Root is `frontend`)
4. Set **Environment Variables**:
   ```env
   VITE_CONTRACT_ID=CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND
   VITE_STELLAR_NETWORK=testnet
   VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   ```
5. Click **Deploy**.

---

## 2. Deploy via Vercel CLI

From your terminal:

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Navigate to frontend folder or repository root
cd frontend

# Run deployment
vercel --prod
```

---

## 3. Edge Reverse Proxy Deployment

The reverse proxy (`@stellar-modular/proxy`) can run as an independent edge container or serverless daemon:

```bash
# Run locally or on edge VPS / Docker:
cd packages/proxy
npm install
npm run build
npm start
```

Or deploy to Railway / Render / Fly.io using the standard Node.js Docker configuration.
