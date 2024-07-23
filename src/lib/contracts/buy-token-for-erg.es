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