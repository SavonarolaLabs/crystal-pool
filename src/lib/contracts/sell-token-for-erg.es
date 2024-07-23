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