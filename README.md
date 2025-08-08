# 🌐 Transparent Subsidy Distribution using Blockchain

An **ongoing project** to build a decentralized and transparent system for tracking and managing government subsidies—from source to beneficiaries—using blockchain technology.

## 🔍 Overview

Government subsidy programs often suffer from inefficiencies, corruption, and a lack of transparency. This project leverages **blockchain** to ensure end-to-end **traceability**, **immutability**, and **accountability** throughout the subsidy distribution pipeline.

> 🚧 **Status**: Work in Progress – core smart contracts are under development; frontend integration and node workflows are being implemented.

### 👥 Actors Involved

The system is being designed with distinct dashboards and functionalities for each stakeholder:

- **Admin/Government Authority**
- **Storage Node**
- **Processing Node**
- **Transport Node**
- **Distribution Node**
- **Beneficiaries**

Each node is registered on the blockchain, and all actions are immutably logged.

---

## ⚙️ Features (Planned & In Progress)

- ✅ Node registration via smart contracts  
- ✅ Immutable logs of item movement  
- 🔄 Real-time tracking of subsidy flow (in progress)  
- 🔐 Role-based access control  
- 📊 Actor-specific dashboards (coming soon)  

---

## 🛠 Tech Stack

| Layer          | Technology            |
|----------------|------------------------|
| Smart Contracts| Solidity               |
| Blockchain     | Ethereum / EVM-based   |
| Dev Tools      | Hardhat, IPFS          |
| Frontend *(planned)* | React / Next.js  |
| Backend *(planned)*  | Node.js / Express|

---

## 🧱 Smart Contract Overview

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransparentSubsidySystem {
    // Structure and logic in progress
}
```

Key Functionalities:
- Register Nodes by Role
- Log Item Transfers
- Query Full Item History

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/)
- [MetaMask](https://metamask.io/)

### Setup

```bash
git clone https://github.com/yourusername/transparent-subsidy-system.git
cd transparent-subsidy-system
npm install
npx hardhat compile
```

To run a local blockchain:

```bash
npx hardhat node
```

To deploy the smart contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## 📂 Project Structure

```
/contracts        --> Solidity smart contracts  
/scripts          --> Deployment scripts  
/test             --> Unit tests  
/frontend         --> (Planned) Actor dashboards  
```

---

## 🧩 Next Steps

- [ ] Finalize smart contract logic  
- [ ] Create frontend dashboards for each actor  
- [ ] IPFS integration for document storage  
- [ ] Role-based authentication and access  
- [ ] System testing and demo release  

---

## 📄 License

MIT License

---

## 🤝 Contributing

We welcome contributions and ideas! If you're interested in joining the development or testing process, feel free to fork the repo, raise an issue, or submit a pull request.
