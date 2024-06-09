import { decodeR7, decodeTokenIdPairFromR6, parseBox, type BoxDB } from '../db/db';
import type { Request, Response, Express } from 'express';
import type { Server } from 'socket.io';
import {
	createExecuteSwapOrderTx,
	signExecuteSwapOrder,
	signSwap,
	swapOrderTxWithCommits,
	type SwapParams
} from '../crystalPool';
import { broadcastOrderBook, broadcastSwapExecute } from '../ioSocket';
import { sellAmount, sellPrice, buyPrice, buyAmount } from '../db/orderBookUtils';
import { serializeBigInt } from '../db/serializeBigInt';
import { splitSellRate } from '$lib/wallet/swap';

export function configureSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/configure', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		//take Pararms
		//find Swap

		const swapParamsExecute = swapParams;

		const [swapBigRate, swapBigDenom] = splitSellRate(swapParams.price);

		const allBoxes = JSON.parse(
			serializeBigInt(
				db.boxRows.filter(
					(br) => br.contract == 'SWAP' && br.parameters.side == swapParams.side
				)
			)
		);

		let maxDenom = allBoxes
			.map((br) => br.parameters.denom)
			.reduce((a, d) => (a < d ? d : a), 0n);

		let swapRateXmaxDenom;

		if (maxDenom < swapBigDenom) {
			maxDenom = swapBigDenom;
		}

		swapRateXmaxDenom = (swapBigRate * maxDenom) / swapBigDenom;
		// Filter Price lower than requested

		let allBoxesWithPrices = allBoxes.map((br) => {
			br.parameters.rateXmaxDenom = (br.parameters.rate * maxDenom) / br.parameters.denom;
			return br;
		});

		let sortBoxes;
		if (swapParams.side == 'sell') {
			sortBoxes = allBoxesWithPrices.sort(
				(a, b) => a.parameters.rateXmaxDenom - b.parameters.rateXmaxDenom
			)[0];
		} else {
			sortBoxes = allBoxesWithPrices.sort(
				(a, b) => b.parameters.rateXmaxDenom - a.parameters.rateXmaxDenom
			)[0];
		}

		swapParamsExecute.amount = sortBoxes.box.assets[0].amount;

		swapParamsExecute.price = (
			sortBoxes.parameters.rate / sortBoxes.parameters.denom
		).toString();

		res.json(swapParamsExecute); //TODO: Add multiple Swap and Box selector
	});
}

export function createSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		const { unsignedTx, publicCommitsPool } = await swapOrderTxWithCommits(swapParams, db);
		res.json({ unsignedTx, publicCommitsPool });
	});
}

export function signSwapOrder(app: Express, io: Server, db: BoxDB) {
	app.post('/swap-order/sign', async (req: Request, res: Response) => {
		const { unsignedTx, extractedHints } = req.body;

		const signedTx = await signSwap(unsignedTx, extractedHints, db);
		broadcastOrderBook('rsBTC_sigUSD', io, db);

		res.json(signedTx);
	});
}

export function executeSwap(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap', async (req: Request, res: Response) => {
		const swapParams: SwapParams = req.body;
		const unsignedTx = createExecuteSwapOrderTx(swapParams, db);
		res.json(unsignedTx);
	});
}

export function signExecuteSwap(app: Express, io: Server, db: BoxDB) {
	app.post('/execute-swap/sign', async (req: Request, res: Response) => {
		const { unsignedTx, proof } = req.body;

		const signedTx = await signExecuteSwapOrder(unsignedTx, proof, db);
		broadcastOrderBook('rsBTC_sigUSD', io, db);

		const swapInput = signedTx.inputs.find((i) => parseBox(i)?.contract == 'SWAP');
		console.log('decodeR6:', decodeTokenIdPairFromR6(swapInput));
		console.log('decodeR7:', decodeR7(swapInput));
		console.dir(parseBox(swapInput));

		const amountB = swapInput.assets[0].amount;
		const rateB = parseBox(swapInput)?.parameters.rate;
		const denomB = parseBox(swapInput)?.parameters.denom;
		const sideB = parseBox(swapInput)?.parameters.side;

		const params = {
			side: 'buy',
			price: 0,
			amount: 0
		};
		if (sideB == 'sell') {
			params.price = Number(sellPrice(rateB, denomB));
			params.amount = Number(sellAmount(amountB));
			params.side = 'buy';
		} else {
			params.price = Number(buyPrice(rateB, denomB));
			params.amount = Number(buyAmount(rateB, denomB, amountB));
			params.side = 'sell';
		}

		broadcastSwapExecute('rsBTC_sigUSD', io, params);

		res.json(signedTx);
	});
}
