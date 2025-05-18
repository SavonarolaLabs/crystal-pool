# Smart Contracts

The project includes smart contracts for Deposit, Swap, Buy, and Sell operations. These contracts rquire more testing and audits.

### 1. Deposit Contract

```scala
{
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].get(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].get(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	
	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF)
	}
}
```

### 2. Swap Contract

```scala
{	
	def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             	= box.R5[Int].getOrElse(0)
	def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
	def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
	def getRate(box: Box)                   = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())

	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2

	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes

	def isSameTokenPair (box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		getBuyingTokenId(SELF)  == getBuyingTokenId(box)

	
    def hasSellingToken(box: Box) = 
		getSellingTokenId(SELF) == getSellingTokenId(box) &&
		box.tokens.size > 0 &&
		getSellingTokenId(SELF) == tokenId(box)

	def hasBuyingToken(box: Box) = 
		getBuyingTokenId(SELF) == getBuyingTokenId(box) &&
		box.tokens.size > 0 &&
		getBuyingTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
		getRate(box) > 0

	def isSameSeller(box: Box)   = 
		getSellerPk(SELF) == getSellerPk(box) &&
		getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
		unlockHeight(SELF) == unlockHeight(box)

 	def isSameMultisig(box: Box)    =
		getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(box: Box) =
		isSameContract(box) &&
		isSameSeller(box) &&
		isSameUnlockHeight(box) && 
		isSameTokenPair(box) &&
		hasSellingToken(box) &&
		isGreaterZeroRate(box) &&
		isSameMultisig(box)

    val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

  	def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)  

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

    def hasMaxSellRate(box: Box) =
        getRate(box) * maxDenom == maxSellRate * getDenom(box) 

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)

	def isPaymentBox(box:Box) =
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		hasBuyingToken(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes

	def sumSellTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmount)

	def sumSellTokensOut(boxes: Coll[Box]): Long = boxes
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmount)

	def sumBuyTokensPaid(boxes: Coll[Box]): Long = boxes
		.filter(isPaymentBox) 
		.fold(0L, sumTokenAmount)

  	val tokensSold = sumSellTokensIn(INPUTS).toBigInt  - sumSellTokensOut(OUTPUTS).toBigInt  

  	val tokensPaid = sumBuyTokensPaid(OUTPUTS).toBigInt 

    	val inSellTokensXRate = INPUTS 
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmountXRate)   

     	val outSellTokensXRate = OUTPUTS  
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)  

    val sellTokensXRate = inSellTokensXRate.toBigInt - outSellTokensXRate.toBigInt  
    val expectedRate = sellTokensXRate.toBigInt  

    val isPaidAtFairRate = maxDenom.toBigInt*tokensPaid.toBigInt >= expectedRate.toBigInt  
 
    if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
} 
```

### 3. Buy Contract

```scala
{
    def getBuyerPk(box: Box)               = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
    def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
    def unlockHeight(box: Box)             = box.R5[Int].getOrElse(0)
    def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getRate(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                 = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
    def getBuyerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())

    def tokenAmount(box: Box) = {
        if(box.tokens.size > 0) 
        {
            box.tokens(0)._2
        } else{
         0L
        } 
    }
  
    def isSameContract(box: Box) = 
        box.propositionBytes == SELF.propositionBytes
  
    def isGreaterZeroRate(box:Box) =
        getRate(box) > 0 &&
        getDenom(box) > 0
  
    def isSameBuyer(box: Box)   = 
        getBuyerPk(SELF) == getBuyerPk(box) &&
        getPoolPk(SELF) == getPoolPk(box)

    def isSameUnlockHeight(box: Box)  = 
        unlockHeight(SELF) == unlockHeight(box)

    def isSameMultisig(box: Box)    =
        getBuyerMultisigAddress(SELF) == getBuyerMultisigAddress(box)

    def isLegitInput(b: Box) = {
        isSameContract(b) && 
        isSameMultisig(b) && 
        isSameBuyer(b) && 
        isSameUnlockHeight(b) &&
        getTokenId(SELF) == getTokenId(b) &&
        isGreaterZeroRate(b)
    }

    def isPaymentBox(box:Box) = {
      isSameBuyer(box) &&
      isSameUnlockHeight(box) &&
      getTokenId(SELF) == getTokenId(box) &&
      getBuyerMultisigAddress(SELF) == box.propositionBytes
    }

    val maxDenom: Long = INPUTS
        .filter(isLegitInput)
        .fold(0L, {(r:Long, box:Box) => {
            if(r > getDenom(box)) r else getDenom(box)
        }}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

    val filteredInputs = INPUTS.filter(isLegitInput)
    val minBuyRate: Long = filteredInputs
      .fold(getRateInMaxDenom(filteredInputs(0)), {(r:Long, box:Box) => {
        if(r < getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

    def hasMinBuyRate(box: Box) =
        getRate(box) * maxDenom == getDenom(box) * minBuyRate

    def isChangeBox(box: Box) =
        isLegitInput(box) &&
        hasMinBuyRate(box)

    def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
    def sumErgXMinRate(a:Long, b: Box) = a + b.value * minBuyRate
    def sumErgXRate(a:Long, b: Box) = a + b.value * getRateInMaxDenom(b) 
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b) 

    val tokensPaid = OUTPUTS.filter(isPaymentBox).fold(0L, sumTokenAmount).toBigInt
    val expectedErgXRate = {
        val in = INPUTS.filter(isLegitInput).fold(0L, sumErgXRate)
        val out = OUTPUTS.filter(isChangeBox).fold(0L, sumErgXMinRate).toBigInt +
        OUTPUTS.filter(isPaymentBox).fold(0L, sumErgXMinRate).toBigInt
        in - out
    }

    val isPaidAtFairRate = tokensPaid * maxDenom >= expectedErgXRate

    if(HEIGHT > unlockHeight(SELF)){
        getBuyerPk(SELF)
    }else{
        getBuyerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
    }
}
```

### 4. Sell Contract

```scala
{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].getOrElse(0)
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getRate(box: Box)                  = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(0)
	def getDenom(box: Box)                 = box.R7[Coll[Long]].getOrElse(Coll[SigmaProp](0L,0L))(1)
    def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].getOrElse(Coll[Byte]())

 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) &&
	  	box.tokens.size > 0 &&
		getTokenId(SELF) == tokenId(box)

  	def isGreaterZeroRate(box:Box) =
    	getRate(box) > 0 &&
		getDenom(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInput(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
		isSameUnlockHeight(b) &&
    	isGreaterZeroRate(b)
	}

  	val maxDenom: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getDenom(box)) r else getDenom(box)
		}}) 
  
    def getRateInMaxDenom(box:Box) = getRate(box)*maxDenom/getDenom(box) 

  	def sumValue(a:Long, b: Box) = a + b.value
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRateInMaxDenom(b)  

    val maxSellRate: Long = INPUTS
      .filter(isLegitInput)
      .fold(0L, {(r:Long, box:Box) => {
        if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
      }})

	def hasMaxSellRate(box: Box) =
    	getRate(box) * maxDenom == getDenom(box) * maxSellRate 

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)
  
	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}

    // calculation
  
	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, sumValue) - INPUTS 
		.filter(isLegitInput)
		.fold(0L, sumValue)

	val inSellTokensXRate = INPUTS 
		.filter(isLegitInput)
		.fold(0L, sumTokenAmountXRate)

	val outSellTokensXRate = OUTPUTS
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)

	val expectedRate = inSellTokensXRate.toBigInt - outSellTokensXRate.toBigInt

    val isPaidAtFairRate = maxDenom.toBigInt * nanoErgsPaid.toBigInt >= expectedRate.toBigInt

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}
```
