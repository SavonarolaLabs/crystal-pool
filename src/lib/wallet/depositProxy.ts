import { SHADOWPOOL_ADDRESS } from "$lib/constants/addresses";
import { first, type Amount, type Box, type EIP12UnsignedTransaction, type OneOrMore, type TokenAmount } from "@fleet-sdk/common";
import { ErgoAddress, OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, SAFE_MIN_BOX_VALUE, SColl, SGroupElement, SInt, SSigmaProp, TransactionBuilder } from "@fleet-sdk/core";

export function sendToDepositProxy(
    DEPOSIT_PROXY_ADDRESS: string,
	blockchainHeight: number,
	inputBoxes: OneOrMore<Box<Amount>>,
	changeAddress: string,
	userPk: string,
	unlockHeight: number,
	tokens: OneOrMore<TokenAmount<Amount>>,
	nanoErg: string | bigint = SAFE_MIN_BOX_VALUE + BigInt(RECOMMENDED_MIN_FEE_VALUE)
): EIP12UnsignedTransaction {
	const depositBox = new OutputBuilder(nanoErg, DEPOSIT_PROXY_ADDRESS)
		.setAdditionalRegisters({
			R4: SColl(SSigmaProp, [
				SGroupElement(
					first(ErgoAddress.fromBase58(userPk).getPublicKeys())
				),
				SGroupElement(
					first(
						ErgoAddress.fromBase58(
							SHADOWPOOL_ADDRESS
						).getPublicKeys()
					)
				)
			]).toHex(),
			R5: SInt(unlockHeight).toHex()
		})
		.addTokens(tokens);

	const unsignedTx = new TransactionBuilder(blockchainHeight)
		.from(inputBoxes)
		.to(depositBox)
		.sendChangeTo(changeAddress)
		.payFee(RECOMMENDED_MIN_FEE_VALUE)
		.build()
		.toEIP12Object();

	return unsignedTx;
}