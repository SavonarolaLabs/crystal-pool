import { BOB_ADDRESS, DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { a, c } from '$lib/wallet/multisig-server';
import { createSwapOrderTx } from '$lib/wallet/swap';
import type { Amount } from '@fleet-sdk/common';
import type { FastifyInstance, FastifyRequest } from 'fastify';

const NEW_SWAP_REQUEST = '/swapNew';
const NEW_SWAP_SIGN = '/swapNewSign';

type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function processNewSwap(fastify: FastifyInstance, opts: any, done: any) {
	fastify.post(
		NEW_SWAP_REQUEST,
		async (request: FastifyRequest<{ Body: SwapRequest }>, reply) => {
			const swapParams = request.body; //Swap Params
			//-----------------------------------
			const height = 1273521;
			const unlockHeight = height + 200000;
			//------------------------------------
			//CreateTx unsignedTx
			const unsignedTx = createSwapOrderTx(
				swapParams.address,
				DEPOSIT_ADDRESS,
				utxos[BOB_ADDRESS], //need helper function and boxes for tests
				{
					tokenId: swapParams.sellingTokenId,
					amount: swapParams.amount
				},
				BigInt(swapParams.price),
				height, //need helper function
				unlockHeight, // need helper function
				swapParams.sellingTokenId,
				swapParams.buyingTokenId
			);

			console.log('unsignedTx:');
			console.log('🚀 ~ POST ~ unsignedTx:', unsignedTx);
			const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
			return { unsignedTx, publicCommitsBob };
		}
	);
	done();
}

export function processNewSwapSign(
	fastify: FastifyInstance,
	opts: any,
	done: any
) {
	fastify.post(
		NEW_SWAP_SIGN,
		async (request: FastifyRequest<{ Body: SwapRequest }>, reply) => {
			const { extractedHints, unsignedTx } = request.body; //TODO: unsignedTx not from USER
			console.log('Server hints', unsignedTx);
			const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
			const signedTx = await c(
				unsignedTx,
				privateCommitsBob,
				extractedHints
			);
			const signedTxToStash = signedTx.to_js_eip12();
			// TODO: Add signedToStash -> to DB -> To orderbook ...
			//console.log(signedTxToStash);

			// TODO: return message properly;
			const message = {
				status: 'succesful',
				message: 'Your order successfully added to orderbook'
			};
			return message;
		}
	);
	done();
}
