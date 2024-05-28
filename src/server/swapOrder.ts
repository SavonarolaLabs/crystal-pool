import { BOB_ADDRESS, DEPOSIT_ADDRESS } from '$lib/constants/addresses';
import { utxos } from '$lib/data/utxos';
import { a } from '$lib/wallet/multisig-server';
import { createSwapOrderTx } from '$lib/wallet/swap';
import type { Amount } from '@fleet-sdk/common';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type SwapRequest = {
	address: string;
	price: bigint;
	amount: Amount;
	sellingTokenId: string;
	buyingTokenId: string;
};

export function processNewSwap(fastify: FastifyInstance, opts: any, done: any) {
	fastify.post(
		'/swapNew',
		async (request: FastifyRequest<{ Body: SumRequestBody }>, reply) => {
			const swapParams = request.body; //Swap Params
			console.log('Params:');
			console.log('🚀 ~ POST ~ swapParams:', swapParams);
			//F

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
				swapParams.price,
				height, //need helper function
				unlockHeight, // need helper function
				swapParams.sellingTokenId,
				swapParams.buyingTokenId
			);

			const { privateCommitsBob, publicCommitsBob } = await a(unsignedTx);
			//return { unsignedTx, publicCommitsBob };
			return { publicCommitsBob };
		}
	);
	done();
}

interface SumRequestBody {
	num1: number;
	num2: number;
}

export const sumRoute = (fastify: FastifyInstance, opts: any, done: any) => {
	fastify.post(
		'/sum',
		async (request: FastifyRequest<{ Body: SumRequestBody }>, reply) => {
			const { num1, num2 } = request.body;
			const sum = num1 + num2;
			return { sum };
		}
	);
	done();
};
