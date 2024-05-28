import { BOB_ADDRESS, DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { a } from '$lib/wallet/multisig-server';
import { createSwapOrderTx } from '$lib/wallet/swap';
import type { Amount } from '@fleet-sdk/common';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type SwapRequest = {
	address: string;
	price: string;
	amount: string;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function processNewSwap(fastify: FastifyInstance, opts: any, done: any) {
	fastify.post(
		'/swapNew',
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
			//return { unsignedTx, publicCommitsBob };
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
		'/swapNew/sign',
		async (request: FastifyRequest<{ Body: SwapRequest }>, reply) => {
			const extractedHints = request.body; //Swap Params
			//return { unsignedTx, publicCommitsBob };
			console.log('signed');
		}
	);
	done();
}
