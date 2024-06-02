# Token Swap Example
In this Example Bob puchases rsBTC for 1k Erdoge from Alice.
Exchange price 1 Erdoge = 1 sat

##Steps

1. Bob deposits 1k Erdoge, 0.01ERG to DEPOSIT_CONTRACT (signed by bobPK)
2. Bob creates a rsBTC/Erdoge SWAP_CONTRACT order (signed by bobPK && poolPk)
3. Alice deposits 0.00001 rsBTC, 0.01ERG to DEPOSIT_CONTRACT (signed by alicePK)
4. Alice swaps 0.00001 rsBTC for 1k Erdoge from SWAP_CONTRACT to to DEPOSIT_CONTRACT (signed by alicePK && poolPk)
5. Alice withdraws 1k Erdoge (signed by alicePK && poolPk)

Please Note: Given example only demonstrates a minimal life cycle from deposit to withdraw without highlighting the core proposition of real time trading between Alice and Bob, that can occur between deposit and withdraw.

##Transactions:

1. Bob deposits 1k Erdoge
```
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: BOB           │              │  address: DEPOSIT       │
│  value: 0.1Erg          │              │  value: 0.0989Erg       │
│  assets:[{              │              │  assets:[{              │
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │
│   amount:  1000         │      │       │   amount:  1000         │
│  }]                     │      │       │  }]                     │
└─────────────────────────┘      │       │  additionalRegisters:{  │
                                 │       │   R4: [BOB,POOL]        │
                                 │       │   R5: unlockHeight      │
                                 │       │  }                      │
                                 │       └─────────────────────────┘
                                 │       ┌─────────────────────────┐
                                 │       │  address: BOB           │
                                 ├────►  │  ...                    │
                                 │       └─────────────────────────┘
                                 │       ┌─────────────────────────┐
                                 │       │  address: FEE           │
                                 └────►  │  value: 0.0011Erg       │
                                         └─────────────────────────┘
```

2. Bob creates a swap order
```
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: DEPOSIT       │              │  address: SWAP          │
│  value: 0989Erg         │              │  value: 0978Erg         │
│  assets:[{              │              │  assets:[{              │
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │
│   amount:  1000         │      │       │   amount:  1000         │
│  }]                     │      │       │  }]                     │
│  additionalRegisters:{  │      │       │  additionalRegisters:{  │
│   R4: [BOB,POOL]        │      │       │   R4: [BOB,POOL]        │
│   R5: unlockHeight      │      │       │   R5: unlockHeight      │
│  }                      │      │       │   R6: [Erdoge,rsBTC]    │
└─────────────────────────┘      │       │   R7: swapRate          │
                                 │       │   R8: DEPOSIT           │
                                 │       │  }                      │
                                 │       └─────────────────────────┘
                                 │       ┌─────────────────────────┐
                                 │       │  address: FEE           │
                                 └────►  │  value: 0.0011Erg       │
                                         └─────────────────────────┘
```

3. Alice deposits 0.00001 rsBTC
```
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: ALICE         │              │  address: DEPOSIT       │
│  value: 0.1Erg          │              │  value: 0.0989Erg       │
│  assets:[{              │              │  assets:[{              │
│   tokenId: rsBTC        │  ────┬────►  │   tokenId: rsBTC        │
│   amount:  0.00001      │      │       │   amount:  0.00001      │
│  }]                     │      │       │  }]                     │
└─────────────────────────┘      │       │  additionalRegisters:{  │
                                 │       │   R4: [ALICE,POOL]      │
                                 │       │   R5: unlockHeight      │
                                 │       │  }                      │
                                 │       └─────────────────────────┘
                                 │       ┌─────────────────────────┐
                                 │       │  address: ALICE         │
                                 ├────►  │  ...                    │
                                 │       └─────────────────────────┘
                                 │       ┌─────────────────────────┐
                                 │       │  address: FEE           │
                                 └────►  │  value: 0.0011Erg       │
                                         └─────────────────────────┘
```

4. Alice swaps 0.00001 rsBTC for 1k Erdoge
```
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: SWAP          │              │  address: DEPOSIT       │
│  value: 0.0978Erg       │              │  value: 0.0978Erg       │
│  assets:[{              │              │  assets:[{              │
│   tokenId: Erdoge       │  ──┐   ┌──►  │   tokenId: Erdoge       │
│   amount:  1000         │    │   │     │   amount:  1000         │
│  }]                     │    │   │     │  }]                     │
│  additionalRegisters:{  │    │   │     │  additionalRegisters:{  │
│   R4: [BOB,POOL]        │    │   │     │   R4: [ALICE,POOL]      │
│   R5: unlockHeight      │    │   │     │   R5: unlockHeight      │
│   R6: [Erdoge,rsBTC]    │    │   │     │  }                      │
│   R7: swapRate          │    ├───┤     └─────────────────────────┘
│   R8: DEPOSIT           │    │   │     ┌─────────────────────────┐
│  }                      │    │   │     │  address: DEPOSIT       │
└─────────────────────────┘    │   │     │  value: 0.0978Erg       │
┌─────────────────────────┐    │   │     │  assets:[{              │
│  address: DEPOSIT       │    │   │     │   tokenId: rsBTC        │
│  value: 0.0989Erg       │  ──┘   ├──►  │   amount:  0.00001      │
│  assets:[{              │        │     │  }]                     │
│   tokenId: rsBTC        │        │     │  additionalRegisters:{  │
│   amount:  0.00001      │        │     │   R4: [BOB,POOL]        │
│  }]                     │        │     │   R5: unlockHeight      │
│  additionalRegisters:{  │        │     │   R6: [Erdoge,rsBTC]    │
│   R4: [ALICE,POOL]      │        │     │  }                      │
│   R5: unlockHeight      │        │     └─────────────────────────┘
│  }                      │        │     ┌─────────────────────────┐
└─────────────────────────┘        │     │  address: FEE           │
                                   └──►  │  value: 0.0011Erg       │
                                         └─────────────────────────┘
```

5. Alice withdraws 1k Erdoge
```
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: DEPOSIT       │              │  address: ALICE         │
│  value: 0.0978Erg       │              │  value: 0.0967Erg       │
│  assets:[{              │              │  assets:[{              │
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │
│   amount:  1000         │      │       │   amount:  1000         │
│  }]                     │      │       │  }]                     │
│  additionalRegisters:{  │      │       └─────────────────────────┘
│   R4: [ALICE,POOL]      │      │       ┌─────────────────────────┐
│   R5: unlockHeight      │      │       │  address: FEE           │
│  }                      │      └────►  │  value: 0.0011Erg       │
└─────────────────────────┘              └─────────────────────────┘
Bob withdraws 0.00001 rsBTC
┌─────────────────────────┐              ┌─────────────────────────┐
│  address: DEPOSIT       │              │  address: ALICE         │
│  value: 0.0978Erg       │              │  value: 0.0967Erg       │
│  assets:[{              │              │  assets:[{              │
│   tokenId: Erdoge       │  ────┬────►  │   tokenId: Erdoge       │
│   amount:  1000         │      │       │   amount:  1000         │
│  }]                     │      │       │  }]                     │
│  additionalRegisters:{  │      │       └─────────────────────────┘
│   R4: [ALICE,POOL]      │      │       ┌─────────────────────────┐
│   R5: unlockHeight      │      │       │  address: FEE           │
│  }                      │      └────►  │  value: 0.0011Erg       │
└─────────────────────────┘              └─────────────────────────┘
```