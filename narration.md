Video demo:

First let's take a look at how Darkmode Bob is trying to sell some of his BTC. Bob is creating a few sell orders. As we can see the sell orders are apearing left in the orderbook, nothing unusual. It looks like Bob is using a centralized exchange, except he is not. Each of his sell orders is a real Ergo transaction build and signed in the background. But more on that later.

Now we switch to Lightmode Alice. She is buying bitcoin. Again, in the background transactions are built and signed, and Bob gets notified instantly.
The magical part about this is that everything happens trustles. Bob and Alice interacted through a swap contract. Each in control of their tokens during this whole time. Their background wallets did all the transaction verifying and signing in the background.


Now let's do a technical deep dive of what happend in the second that Bob created his first sell order. For Bob, he just clicked the sell button and an open order appeared. But there area actually 6 steps that happened.

First Step: After clicking sell, Bob's background agent requested a new swap order transaction from the crystal pool.
Second Step: Crystal Pool created an unsigned transaction that takes some of Bob's tokens at the deposit contract and sends them to the swap contract.
Thirst Step: Bob's background agent validated this transaction and made sure that it 100% matches Bob's input and intent.
Fourth Step: Bob's background agent signs the transaction and sends it back to the crystal pool.
Fifth Step: Crystal pool receives a swap transaction signed by Bob, adds it's own signature and submits it to the ergo network if there is some free space in the mempool or saves for later. More on transaction caching later.
Six step: Crystal pool notifies Bob about an orderbook change.

Here we can see the actual swap contract UTXO that was created by Bob.
Crystal pool advances blochain state in real time, acting like a transaction cache.

As we can see in this simple comparison table. At a centralized exchange, you have no ownership over your assets, but trading is fast a.f. and on a dex you are in control of your funds but it's resident sleeper sometimes. Crystal pool model aims to offer instant trading while keeping the user in control of his funds and settling all transactions on L1. Crystal pool has it's own trade-off, please take a look at the documentaion for more on this topic.

There are four smart contracts: deposit, buy, sell and swap. Each of the contracts include a concept called time limited multisig. This concept enables instant transactions without taking away users control over his assets.
When user sends his funds to the deposit contract, his signature is still required to move funds, together with the signature of the crystal pool service. But making the deposit contract a simple classical multisig would make it possible for the service to hold users funds hostage. That's where the time limiting factor comes into play. After the blockchain advances to a certain height, the user automaticaly gains full access over deposited funds and crystal pool service loses it's veto right. For seamless trading experience time lock period can be extended with user's concent.

Seconds design decision that enables instant trading on Layer 1 is transaction caching. Mempool space is limited and prone spikes in transaction volume. Crystal pool maintans and advances transactions without waiting for available mempool space. Of course the service cannot create an unreasonably large amount of unconfirmed transactions, but it very useful for spikes in trading activity.

The third and last component of instant trading is the built-in wallet. There is no more need to review transaction details and sign each transaction manually. Built-in wallet handles all transaction validation for the user, and only signs transactions if those match intent. Of course it's not as secure as an external wallet, for two reasons. Reason number one mallicious client code can access and exploit the wallet, risk mitigation is done by limiting and carefully choosing client packages. Second reason why a built-in wallet can be a bad idea is when it's inside a website. If the server get's hacked it can be over for all clients. But luckily there is a way out. The solution is simple, distribute the ui as native desktop and app. Desktop app build is already done, mobile soon tm.

For more information and a list of imlemented and not yet implemented features please visit crystal-pool github.


