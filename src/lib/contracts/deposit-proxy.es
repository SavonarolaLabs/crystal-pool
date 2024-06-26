{
  val goesToDepositAddress = OUTPUTS(0).propositionBytes == _depositAddress
  val noErgStolen = OUTPUTS(0).value == INPUTS.fold(0L, {(acc: Long, input: Box) => acc + input.value})
  val noTokensStolen = OUTPUTS(0).tokens == INPUTS.fold(Coll[(Coll[Byte], Long)](), {(acc: Coll[(Coll[Byte], Long)], input: Box) => acc ++ input.tokens})
  sigmaProp(allOf(Coll(
  goesToDepositAddress ,
  noErgStolen ,
  noTokensStolen)))
}