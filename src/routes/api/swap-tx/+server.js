/** @type {import('./$types').RequestHandler} */
export async function POST({ params }) {
	console.log("api/swap-tx/")
	console.log(params)

  /*
		//ADD TYPE
		//-----------------------------------
		const height = 1273521;
		const unlockHeight = height + 200000;
		//------------------------------------

		//CreateTx unsignedTx
		unsignedTx = buy(
			height, //need helper function
			utxos[BOB_ADDRESS], //need helper function and boxes for tests
			buyParams.address,
			buyParams.price,
			unlockHeight, // need helper function
			{ tokenId: buyParams.buyingTokenId, amount: buyParams.amount }
		);

		const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);

  */

	return new Response(String("signed"));
}