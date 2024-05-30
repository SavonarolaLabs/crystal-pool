export const swapTokensDenom = `{	
	def getSellerPk(box: Box)              	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(0)
	def getPoolPk(box: Box)                	= box.R4[Coll[SigmaProp]].getOrElse(Coll[SigmaProp](sigmaProp(false),sigmaProp(false)))(1)
	def unlockHeight(box: Box)             	= box.R5[Int].get
	def getSellingTokenId(box: Box)        	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._1
	def getBuyingTokenId(box: Box)         	= box.R6[(Coll[Byte],Coll[Byte])].getOrElse((Coll[Byte](),Coll[Byte]()))._2
	def getRate(box: Box)                  	= box.R7[Long].get
	def getSellerMultisigAddress(box: Box)  = box.R8[Coll[Byte]].get
  //+R9 = 1000n

  //BOX 1: 
  //price 69;
  //denom 1000;
  
  //BOX 1: (To same Denom) 
  //price 69000;
  //denom 1000000;


  //BOX 2:
  //price 13131;
  //denom 1000000;

  //isLigitBox -> 
  //  findMaxDenom
  
  // getRate -> getRateInMaxDenom()

	def tokenId(box: Box) = box.tokens(0)._1
	def tokenAmount(box: Box) = box.tokens(0)._2
  	def sumTokenAmount(a:Long, b: Box) = a + tokenAmount(b)
  	def sumTokenAmountXRate(a:Long, b: Box) = a + tokenAmount(b) * getRate(b)   // <---------------- REWORK

//------------------------
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
//-------------------------

//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

	val maxSellRate: Long = INPUTS
		.filter(isLegitInput)
		.fold(0L, {(r:Long, box:Box) => {
			if(r > getRate(box)) r else getRate(box)
		}}) //TODO: REWORK WITH - MAX DENOM - CHECK R9 WITH R6

  	def hasMaxSellRate(box: Box) =
		getRate(box) == maxSellRate //TODO: CHECK R9 WITH R6

  	def isLegitSellOrderOutput(box: Box) =
	  	isLegitInput(box)&&
	  	hasMaxSellRate(box)
//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

//-------------------------
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
//-------------------------

//-----------------
  	val tokensSold = sumSellTokensIn(INPUTS) - sumSellTokensOut(OUTPUTS) //rsBTC on contract (delta) (10000)
  	val tokensPaid = sumBuyTokensPaid(OUTPUTS) //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000
//-----------------

	val inSellTokensXRate = INPUTS  //VOLUME INPUT ON CONTRACT
		.filter(isLegitInput) 
		.fold(0L, sumTokenAmountXRate)   // Учитывает макс деном 

  	val outSellTokensXRate = OUTPUTS //VOLUME OUTPUT ON CONTRACT 
		.filter(isLegitSellOrderOutput)
		.fold(0L, sumTokenAmountXRate)  // Учитывает макс деном  

	val sellTokensXRate = inSellTokensXRate - outSellTokensXRate  // DELTA VOLUME в Макс деноме
	val expectedRate = sellTokensXRate / tokensSold   // 23125124 - DENOM MAX

  	val isPaidAtFairRate = tokensPaid/tokensSold >= expectedRate  //sigUSD PAID (20) + ADD DENOM (1000) = > 20_000. * MAX_DENOM

	if(HEIGHT > unlockHeight(SELF)){
		getSellerPk(SELF)
	}else{
		getSellerPk(SELF) && getPoolPk(SELF) || sigmaProp(isPaidAtFairRate) && getPoolPk(SELF)
	}
}`;
