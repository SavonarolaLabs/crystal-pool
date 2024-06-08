import type { SwapRequest } from './tradingService';

const CRYSTALPOOL_URL = 'http://127.0.0.1:3000';
const CONFIGURE_SWAP_REQUEST = '/swap-order/configure';
const NEW_SWAP_REQUEST = '/swap-order';
const NEW_EXECUTE_REQUEST = '/execute-swap';
const NEW_EXECUTE_SIGN = '/execute-swap/sign';
const NEW_SWAP_SIGN = '/swap-order/sign';
const ORDER_BOOK = '/order-book/';
const USER_BOXES = '/boxes/';

export async function get(address: string) {
	let res = await fetch(CRYSTALPOOL_URL + address, {
		headers: {
			'Content-Type': 'application/json'
		}
	});
	const data = await res.json();
	return data;
}

export async function post(address: string, props: any) {
	let res = await fetch(CRYSTALPOOL_URL + address, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(props)
	});
	const data = await res.json();
	return data;
}

export async function configureSwapTx(
	swapParams: SwapRequest
): Promise<{ swapParamsExecute: SwapRequest }> {
	return await post(CONFIGURE_SWAP_REQUEST, swapParams);
}

export async function createSwapTx(
	swapParams: any
): Promise<{ unsignedTx: any; publicCommitsPool: any }> {
	return await post(NEW_SWAP_REQUEST, swapParams);
}

export async function executeSwapTx(swapParams: any): Promise<any> {
	return await post(NEW_EXECUTE_REQUEST, swapParams);
}

export async function signSwapTx(extractedHints: any, unsignedTx: any): Promise<any> {
	return await post(NEW_SWAP_SIGN, {
		extractedHints,
		unsignedTx
	});
}

export async function signExecuteSwapTx(proof: any, unsignedTx: any): Promise<any> {
	return await post(NEW_EXECUTE_SIGN, {
		proof,
		unsignedTx
	});
}

export async function orderBook(pair: string): Promise<any> {
	return await get(ORDER_BOOK + pair);
}

export async function userBoxes(address: string): Promise<any> {
	return await get(USER_BOXES + address);
}
