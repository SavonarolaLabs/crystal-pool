**CrystalPool: Realtime Order-Based Exchange on L1**

**Authors:** c8 c8e4@proton.me, savonarola  
**Github:** https://github.com/SavonarolaLabs/crystal-pool
**Documentation:** https://savonarolalabs.github.io/crystal-pool/#/
**Date:** May 23, 2024

CrystalPool is a simple concept for a self-custodial exchange that offers instant order execution and UX that is comparable to centralized exchanges. At ErgohackVIII this project aims to deliver a proof of concept for: a user interface UI for trading, an order book management system, and core functionalities for handling and storing chains of unsubmitted transactions. 100% of the code is open-source.

**Key Components:**

1. **Web UI with integrated wallet**: For trading and signing transactions in the background on user Actions.
2. **Pool Service**: Builds and strores a transaction tree in realtime, submits it to the mempool asynchrnously. Notifies connected clients about orderbook updates and recent trades via a socket. Service also provides a public api for the latest utxo set.

**Model and Mechanism:**
CrystalPool enables instant transactions on Layer 1 (L1) through the integration of time-limited multisig smart contracts, a headless wallet, and targeted UX decisions. Self-custody of user funds is achieved by requiring both the user's public key (userPK) and the pool's public key (poolPK) to sign operations before a specified time limit. After this time limit, the userPK gains full control over the operations, to garantee that a rogue pool cannot hold user funds hostage.

**Real-Time UI updates:**
CrystalPool provides real-time balance and state updates. Each trading action generates a new transaction, maintained in a chain of temporary, unsubmitted signed transactions. These transactions are published asynchronously in the background, ensuring a seamless trading experience.

**Built-in Wallet:**
To enhance the user experience, a built-in wallet is integrated into the trading client. The trading UI manages user balances based on the latest DEPOSIT, SWAP, BUY, and SELL activities. This built-in wallet ensures a seamless experience by signing transactions in the background. To maintain a trustless process, each transaction presents a simple summary **integrated in the UI** to the user, who can then choose to confirm or discard it.


**Know Your Assumtions (KYA)**

**Protocol:**
All transactions are settled on L1 and incur a transaction fee. CrystalPool maintains a public set of unsubmitted transactions. User funds are protected by userPK at the level of smart-contracts. In case of service shutdown, users can withdraw their deposits/orders after the unlockHeight period.

**Smart Contracts:**
The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts require more testing and audits.

**Potential Loss of Unsubmitted Transactions:**
In an environment characterized by a constantly busy mempool and rising transaction fees, it is conceivable to imagine a scenario where an unsubmitted transaction tree with a low-fee root cannot be submitted before the unlock height.


