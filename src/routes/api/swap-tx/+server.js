import { BOB_ADDRESS, DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { a } from '$lib/wallet/multisig-server';
import { createSwapOrderTx } from '$lib/wallet/swap';
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const swapParams = await request.json();
	//ADD TYPE
	//-----------------------------------
	const height = 1273521;
	const unlockHeight = height + 200000;
	//------------------------------------

	//CreateTx unsignedTx
	const unsignedTx = createSwapOrderTx(
		swapParams.address,
		DEPOSIT_ADDRESS,
		utxos[BOB_ADDRESS], //need helper function and boxes for tests
		{ tokenId: swapParams.sellingTokenId, amount: swapParams.amount },
		swapParams.price,
		height, //need helper function
		unlockHeight, // need helper function
		swapParams.sellingTokenId,
		swapParams.buyingTokenId
	);

	const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
	//return { unsignedTx, publicCommitsBob };

	return new Response(JSON.stringify({ unsignedTx, publicCommitsBob }), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
}
