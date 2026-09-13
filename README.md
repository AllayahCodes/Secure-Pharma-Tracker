# SecurePharmaTracker

A blockchain-based pharmaceutical supply chain tracker that provides an immutable, role based system for recording batch custody, quality testing, and compliance auditing on-chain.

## Overview

SecurePharmaTracker addresses a real problem in pharmaceutical supply chains: proving custody and compliance in a way that can't be tampered with after the fact. Every batch created, quality test recorded, and status change is written to the blockchain and permanently auditable.

## Features

- **Role-based access control** - Manufacturer, distributor, Regulator, and Auditor roles each have distinct permissions, enforced at the smart contract level via OpenZeppelin's AccessControl
- **Batch registration** - create and track pharmaceutical batches with unique IDs, drug names, quantities, and expiry dates
- **Quality testing** - record and attest lab test results against specific batches, cryptographically signed by the submitting wallet
- **Compliance audit trail** - a full, immutable log of every action (batch creation, qualitt tests, custody transfers) with timestamps and transaction hashes
- **MetaMask integration** - connect a wallet and interact with the contract directly from the browser

## Tech Stack

- **Smart Contract:** Solidity, OpenZeppelin (AccessControl, ReentrancyGuard, Pausable)
- **Development environment:** Hardhat
- **Frontend:** React, TypeScript
- **Wallet integration:** MetaMask, ether.js

## Architecture

The contract enforces four core roles:
- `MANUFACTURER_ROLE` - can create batches and log quality tests
- `DISTRIBUTOR_ROLE` - can update custody/status
- `REGULATOR_ROLE` - oversight and compliance actions
- `AUDITOR_ROLE` - read/verification access

## Demo

...

## Running Locally

1. Clone the repo
   ```bash
   git clone https://github.com/AllayahCodes/Secure-Pharma-Tracker.git
   cd Secure-Pharma-Tracker
   
1. Install dependencies
npm install

2. Start a local Hardhat node (in one terminal)
npx hardhat node

3. Deploy the contract (in a second terminal)
npm run deploy

4. Copy the deployed contract address into the frontend config, and connect MetaMask to the Hardhat Local Network (Chain ID 31337, RPC https://127.0.0.1:8545)

