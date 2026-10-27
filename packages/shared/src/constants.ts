export const STELLAR_CONFIG = {
  TESTNET: {
    network: 'stellar-testnet' as const,
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    contractId: 'CAQNUJ7CNCRDSVTE6QY2WRHP6W3ZVAYE4WRYVFTYE6BGXPPJ2WG4RRND',
    nativeSac: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    testnetUsdc: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUIE3USSTHZX5COQN4',
    deployerPublicKey: 'GCBZC5TOFMEZ6WXL5TDXAMKP7J5RIVHKYBMPHOYX6WR55UXBCLASC4DY',
    explorerBase: 'https://stellar.expert/explorer/testnet',
  },
  HEADERS: {
    PAYMENT: 'x-stellar-payment',
    PAYMENT_RESPONSE: 'x-stellar-payment-response',
    CHALLENGE: 'x-stellar-challenge',
    NONCE: 'x-stellar-nonce',
  },
  DEFAULT_PROTOCOL_FEE_BPS: 250, // 2.5%
};
