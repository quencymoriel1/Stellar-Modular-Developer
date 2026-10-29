# Contributing to Stellar Modular Developer

Thank you for your interest in contributing to **Stellar Modular Developer**! We welcome contributions from the community to help advance decentralized API monetization and the x402 payment protocol on Stellar & Soroban.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please treat fellow contributors with respect and professionalism.

---

## Monorepo Architecture

This project is structured as an npm workspaces monorepo:

- **`contracts/modular_developer/`**: Rust Soroban smart contract (`stellar_modular_developer`) compiled to WebAssembly.
- **`packages/shared/`**: TypeScript types, x402 challenge/response specifications, and Soroban client helpers.
- **`packages/proxy/`**: Fastify edge reverse proxy enforcing HTTP 402 Payment Required challenges and payment verifications.
- **`packages/cli/`**: Developer CLI tool (`smd`) for registering APIs, checking status, and automated micropayment test calls.
- **`packages/mcp/`**: Model Context Protocol (MCP) server enabling autonomous AI agents (Claude, Cursor, Gemini) to call paid endpoints.
- **`frontend/`**: Cyber-Stellar developer portal and interactive x402 live tester built with React and Vite.

---

## Development Prerequisites

Before getting started, make sure you have the following installed:

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Rust**: `1.80+` with the `wasm32-unknown-unknown` target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar CLI** (optional, for deploying smart contracts):
  ```bash
  cargo install --locked stellar-cli --features opt
  ```

---

## Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/quencymoriel1/Stellar-Modular-Developer.git
   cd Stellar-Modular-Developer
   ```

2. **Install monorepo dependencies:**
   ```bash
   npm install
   ```

3. **Build the packages and contracts:**
   ```bash
   # Build contract unit tests
   cargo test --manifest-path contracts/modular_developer/Cargo.toml

   # Build TypeScript packages
   npm run build
   ```

4. **Run the frontend locally:**
   ```bash
   npm run dev:frontend
   ```

5. **Start the edge proxy locally:**
   ```bash
   npm run start:proxy
   ```

---

## Guidelines for Contributions

### Git Commit Guidelines
We follow standard Conventional Commits:
- `feat:` New features or capabilities
- `fix:` Bug fixes or security patches
- `docs:` Documentation updates
- `refactor:` Code improvements without behavioral changes
- `test:` Adding or updating tests

### Security Best Practices
- **Never commit private keys, secrets, or credentials** to git.
- Use placeholders (e.g. `S...YOUR_TESTNET_SECRET_KEY...`) in all documentation and sample snippets.
- Use environment variables (e.g. `STELLAR_DEPLOYER_SECRET_KEY`, `STELLAR_AGENT_SECRET_KEY`) for local testing.

---

## Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Commit your changes with clear messages.
3. Verify all tests pass:
   ```bash
   cargo test --manifest-path contracts/modular_developer/Cargo.toml
   ```
4. Push to your branch and open a Pull Request against `main`.

---

## Questions & Feedback

If you find a bug or have a suggestion, please open an Issue on [GitHub](https://github.com/quencymoriel1/Stellar-Modular-Developer/issues).
