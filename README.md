# CrystalPool: Instant trading on L1

**Documentation:** [CrystalPool](https://savonarolalabs.github.io/crystal-pool/#/)  

![CrystalPool UI](./docs/ui.png?raw=true "CrystalPool UI")

CrystalPool is simple concept for self-custodial instant trading on L1. At ErgohackVIII, a simple UI and pool service was build. The UI enables creation and execution of swap orders, signs transactions in the background and reflects changes in real time. Pool service advances the trading transaction tree in real time and maintains a UTXO set.

**Implemented Features:**

- **User Interface:**
  - [x] integrated wallet
  - [x] websocket
  - [x] Web UI with alipay css
  - [x] Real-time market trades
  - [x] Real-time orderbook
  - [ ] Orderbook settings
  - [ ] Wallet View
  - [ ] Import/Export Wallet
  - [ ] Trading Pairs
  - [ ] Current Trading Pair Stats (Header)
  - [ ] Price Chart
  - [ ] Open Orders
  - [ ] Order History
  - [ ] Available Mempool space
  - [ ] Connection Status

- **Basic Functions:**
  - [ ] different trading pairs
  - [ ] deposit
  - [ ] deposit via ergopay
  - [ ] deposit via webwallet
  - [ ] withdraw

- **Pool Service:**
  - [x] webserver
  - [x] websocket
  - [x] db (sqlite3)
  - [x] wallet functions
  - [x] create swap order tx
  - [x] sign swap order tx
  - [ ] monitor current mempool space
  - [ ] publish transactions
  - [ ] sign inividual multisig inputs
  - [ ] unlockHeight renewal in epochs
  - [ ] price data source

- **Smart Contracts:**
  - [x] deposit
  - [x] buy
  - [x] sell
  - [x] swap

- **Smart Contract Integration:**
  - [x] deposit
  - [ ] buy
  - [ ] sell
  - [x] swap

- **Release:**
  - [ ] SocketSupply -> enables native builds
  - [ ] Build
  - [ ] Build for Mac
  - [ ] Build for Windows
  - [ ] Build for Linux
  - [ ] Build for iOS
  - [ ] Build for Android

**Key Parts:**

1. **Web UI with integrated wallet:** For trading and background signing transactions.
2. **Pool Service:** Builds and stores a transaction tree in real-time, submits it to the mempool asynchronously, and notifies connected clients about orderbook updates and recent trades. Provides a public API for the latest UTXO set.

**Model and Mechanism:**
CrystalPool enables instant transactions on Layer 1 (L1) through the integration of time-limited multisig smart contracts, a headless wallet, and targeted UX decisions. Self-custody of user funds is achieved by requiring both the user's public key (userPK) and the pool's public key (poolPK) to sign operations before a specified time limit. After this time limit, the userPK gains full control over the operations, guaranteeing that a rogue pool cannot hold user funds hostage.

**Real-Time UI updates:**
CrystalPool provides real-time balance and state updates. Each trading action generates a new transaction, maintained in a chain of temporary, unsubmitted signed transactions in the pool service. These transactions are published asynchronously in the background, ensuring a seamless trading experience.

**Built-in Wallet:**
To enhance the user experience, a built-in wallet is integrated into the trading client. The trading UI manages user balances based on the latest DEPOSIT, SWAP, BUY, and SELL activities. This built-in wallet ensures a seamless experience by signing transactions in the background.

**Know Your Assumptions (KYA)**

**Protocol:**
All transactions are settled on L1 and incur a transaction fee. CrystalPool maintains a public set of unsubmitted transactions. User funds are protected by userPK at the level of smart contracts. In case of service shutdown, users can withdraw their deposits/orders after the unlockHeight period.

**Smart Contracts:**
Smart contracts for Deposit, Swap, Buy, and Sell operations are at it's core simple limit order contracts exteded with time limited multisigs. These contracts require more testing and audits.

**Potential Loss of Unsubmitted Transactions:**
In an environment characterized by a constantly busy mempool and rising transaction fees, it is conceivable to imagine a scenario where an unsubmitted transaction tree with a low-fee root cannot be submitted before the unlock height.