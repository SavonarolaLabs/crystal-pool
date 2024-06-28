{
  val sentToDepositContract  = OUTPUTS(0).propositionBytes == _depositAddress
  val userPKset              = OUTPUTS(0).R4[Coll[SigmaProp]].get(0).propBytes == _userPk
  val poolPKset              = OUTPUTS(0).R4[Coll[SigmaProp]].get(1).propBytes == _poolPk
  val unlockHeightSet        = OUTPUTS(0).R5[Int].get == _unlockHeight  
  
  val ergForwarded        = OUTPUTS(0).value == INPUTS.fold(0L, {(acc: Long, input: Box) => acc + input.value}) - _minerFee
 
  val tokensForwarded = {
    val inputTokens = INPUTS.flatMap({ (input: Box) => input.tokens })
    val outputTokens = OUTPUTS(0).tokens

    inputTokens.forall({ (inputToken: (Coll[Byte], Long)) =>
      val tokenId = inputToken._1
      
      def filterByTokenId(t: (Coll[Byte], Long)): Boolean = {
        t._1 == tokenId
      }

      def sumTokenValue(acc: Long, t: (Coll[Byte], Long)): Long = {
        acc + t._2
      }

      val inputAmount = inputTokens
        .filter(filterByTokenId)
        .fold(0L, sumTokenValue)
      val outputAmount = outputTokens
        .filter(filterByTokenId)
        .fold(0L, sumTokenValue)
      inputAmount == outputAmount
    })
  }

  val validMinerFee = {
        val minerFeeErgoTreeBytesHash: Coll[Byte] = fromBase16("e540cceffd3b8dd0f401193576cc413467039695969427df94454193dddfb375")
        OUTPUTS.map({ (output: Box) =>
            if (blake2b256(output.propositionBytes) == minerFeeErgoTreeBytesHash) output.value else 0L
        }).fold(0L, { (a: Long, b: Long) => a + b }) == _minerFee
  }

  sigmaProp(allOf(Coll(
    sentToDepositContract,
    userPKset,
    poolPKset,
    unlockHeightSet,
    ergForwarded ,
    tokensForwarded,
    validMinerFee
  )))
}
