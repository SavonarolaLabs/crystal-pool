{	
	def getSellerPk(box: Box)              = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                = box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             = box.R5[Int].get
	def getTokenId(box: Box)               = box.R6[Coll[Byte]].getOrElse(Coll[Byte]()) 
	def getSellRate(box: Box)              = box.R7[Long].get
	def getSellerMultisigAddress(box: Box) = box.R8[Coll[Byte]].get
	def getDenom(box: Box)                 = box.R9[Long].get //add getDenom


 	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  
	def isSameContract(box: Box) = 
		box.propositionBytes == SELF.propositionBytes
  
	def isSameToken(box: Box)    = 
	  	getTokenId(SELF) == getTokenId(box) && 	// R6 
	  	box.tokens.size > 0 &&				
		getTokenId(SELF) == tokenId(box) 		// first token 

  	def isGreaterZeroRate(box:Box) =
    	getSellRate(box) > 0
  
	def isSameSeller(box: Box)   = 
    	getSellerPk(SELF) == getSellerPk(box) &&
    	getPoolPk(SELF) == getPoolPk(box)

  	def isSameUnlockHeight(box: Box)  = 
    	unlockHeight(SELF) == unlockHeight(box)

  	def isSameMultisig(box: Box)    =
    	getSellerMultisigAddress(SELF) == getSellerMultisigAddress(box)

	def isLegitInputBox(b: Box) = {
	    isSameContract(b) && 
    	isSameToken(b) && 
    	isSameMultisig(b) && 
    	isSameSeller(b) && 
    	isGreaterZeroRate(b) &&
		isSameUnlockHeight(b)
	} 

	def isPaymentBox(box:Box) = {
		isSameSeller(box) &&
    	isSameUnlockHeight(box) &&
		getTokenId(SELF) == getTokenId(box) &&
		getSellerMultisigAddress(SELF) == box.propositionBytes
	}
  
	def sumTokensIn(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox) 
		.fold(0L, {(a:Long, b: Box) => a + b.tokens(0)._2})

	def sumTokensValueIn(boxes: Coll[Box]): Long = boxes
	.filter(isLegitInputBox) 
	.fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*b.tokens(0)._2/getDenom(b)})
  
	val tokensValueIn: Long = sumTokensValueIn(INPUTS)


	//------------------ MAX SELL BLOCK ------------------
	val maxDenom: Long = INPUTS
		.filter(isLegitInputBox)
		.fold(0L, {(r:Long, box:Box) => {
		if(r > getDenom(box)) r else getDenom(box)
	}}) //LegitInput - LegitInputBox

    def getRateInMaxDenom(box:Box) = getSellRate(box)*maxDenom/getDenom(box) 

	val maxSellRate = INPUTS
    	.filter(isLegitInputBox)
    	.fold(0L, {(r:Long, box:Box) => {
		    if(r > getRateInMaxDenom(box)) r else getRateInMaxDenom(box)
		}})
	
	def hasMaxSellRate(box: Box) =
    getSellRate(box)*maxDenom==getDenom(box)*maxSellRate 

	def sumTokensInAtMaxRate(boxes: Coll[Box]): Long = boxes
		.filter(isLegitInputBox)
		.filter(hasMaxSellRate)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)})
  

	def isMaxRateChangeBox(box: Box) = {
		isSameSeller(box) &&
		isSameUnlockHeight(box) &&
		isSameToken(box) &&
		hasMaxSellRate (box) &&  
		isSameMultisig(box) &&
		isSameContract(box)
	}
	//------------------ MAX SELL BLOCK ------------------

  
	def tokensRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + tokenAmount(b)}) 
	
	def valueRemaining(boxes: Coll[Box]): Long = boxes
		.filter(isMaxRateChangeBox)
		.fold(0L, {(a:Long, b: Box) => a + getSellRate(b)*tokenAmount(b)/getDenom(b)}) //TODO: CHECK 1.6 / 0.6 / 0.1 ...
	
	val tokensBack: Long = tokensRemaining(OUTPUTS)		
	val tokensValueOut: Long = valueRemaining(OUTPUTS)
	val soldValue: Long = tokensValueIn - tokensValueOut 

	val nanoErgsPaid: Long = OUTPUTS
		.filter(isPaymentBox)
		.fold(0L, {(a:Long, b: Box) => a + b.value})
  
	val tokensInputAtMaxRate = sumTokensInAtMaxRate(INPUTS) 
	val sellOrderChangeBoxIsFine = tokensInputAtMaxRate > tokensBack	
	val sellerPaid: Boolen = soldValue <= nanoErgsPaid  

	val orderFilled = sellerPaid && sellOrderChangeBoxIsFine  			

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(orderFilled) && getPoolPk(SELF)
	}
}