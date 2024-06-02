**Know Your Assumptions (KYA)**

**Protocol:**
All transactions are settled on L1 and incur a transaction fee. CrystalPool maintains a public set of unsubmitted transactions. User funds are protected by userPK at the level of smart-contracts. In case of service shutdown, users can withdraw their deposits/orders after the unlockHeight period.

**Smart Contracts:**
The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts rqeuire more testing and audits.

**Potential Loss of Unsubmitted Transactions:**
In an environment characterized by a constantly busy mempool and rising transaction fees, it is conceivable to imagine a scenario where an unsubmitted transaction tree with a low-fee root cannot be submitted before the unlock height.