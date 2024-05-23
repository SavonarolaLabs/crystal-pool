**Know Your Assumtions (KYA)**

**Protocol:**
All transactions are settled on L1 and incur a transaction fee. CrystalPool maintains a public set of unsubmitted transactions, with real-time balance calculations based on the latest known state. Security is ensured as CrystalPool cannot move user balances without the userPK. In case of service shutdown, users can withdraw their deposits/orders after the unlockHeight period.

**Smart Contracts:**
The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts reuire more testing and audits.

**Potential Loss of Unsubmitted Transaction:**
In an environment characterized by a constantly busy mempool and rising transaction fees, it is conceivable to imagine a scenario where an unsubmitted transaction tree with a low-fee root cannot be submitted before the unlock height.