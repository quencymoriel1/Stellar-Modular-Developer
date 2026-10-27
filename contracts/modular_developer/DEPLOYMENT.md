# Stellar Modular Developer — On-Chain Contract Deployment

## Deployed Testnet Contract Details

| Parameter | Value |
|---|---|
| **Contract ID** | `CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND` |
| **WASM Hash** | `05631702c50b4542dbbaaf51ed33c843f7393377b772b7a770e6bd24af773418` |
| **Network** | Stellar Testnet (Protocol 29/30) |
| **Deployer Public Key** | `GCBZC5TOFMEZ6WXL5TDXAMKP7J5RIVHKYBMPHOYX6WR55UXBCLASC4DY` |
| **Deploy Transaction** | [`ff9ff5f1ec988d00acf415227ad24bc8da90b810f35dfd84355402541eb27c85`](https://stellar.expert/explorer/testnet/tx/ff9ff5f1ec988d00acf415227ad24bc8da90b810f35dfd84355402541eb27c85) |
| **Init Transaction** | [`7124aab23e5e98f9b884ac763b86ebcf54321bf6d7d815e769a57e92ed0b6ee4`](https://stellar.expert/explorer/testnet/tx/7124aab23e5e98f9b884ac763b86ebcf54321bf6d7d815e769a57e92ed0b6ee4) |
| **Seeded Service Registration** | [`7f8614344d5e3d2267057dc97c4ad6956add9b549f8f92c0dde802d04bad6ae6`](https://stellar.expert/explorer/testnet/tx/7f8614344d5e3d2267057dc97c4ad6956add9b549f8f92c0dde802d04bad6ae6) |
| **Stellar Expert Contract Explorer** | [View Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND) |

---

## Contract Methods & ABI

### 1. `initialize`
- **Arguments**:
  - `admin: Address`
  - `treasury: Address`
  - `protocol_fee_bps: u32` (e.g. 250 for 2.5%)
- **Returns**: `Result<(), ContractError>`

### 2. `register_service`
- **Arguments**:
  - `provider: Address` (Requires authentication)
  - `service_id: Symbol`
  - `name: String`
  - `url_hash: BytesN<32>` (SHA-256 of target origin URL)
  - `price_stroops: i128` (1 XLM = 10,000,000 stroops)
  - `token: Address` (SAC address for XLM or USDC)
  - `rev_split_bps: u32` (Provider share, e.g. 8500 = 85%)
  - `metadata_uri: String`
- **Returns**: `Result<(), ContractError>`

### 3. `pay_per_call`
- **Arguments**:
  - `caller: Address` (Requires authentication)
  - `service_id: Symbol`
  - `nonce: BytesN<32>` (Cryptographic random nonce)
- **Returns**: `Result<CallReceipt, ContractError>`

### 4. `create_tier`
- **Arguments**:
  - `provider: Address`
  - `service_id: Symbol`
  - `tier_id: u32`
  - `duration_ledgers: u32`
  - `max_calls: u32`
  - `price_stroops: i128`
- **Returns**: `Result<(), ContractError>`

### 5. `subscribe_tier`
- **Arguments**:
  - `caller: Address`
  - `service_id: Symbol`
  - `tier_id: u32`
- **Returns**: `Result<(), ContractError>`

### 6. `check_access`
- **Arguments**:
  - `caller: Address`
  - `service_id: Symbol`
- **Returns**: `bool`
