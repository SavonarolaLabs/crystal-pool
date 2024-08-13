import {
	BUY_ORDER_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS,
	SWAP_ORDER_ADDRESS
} from '$lib/constants/addresses';
import { tradingPairs } from '$lib/constants/tokens';
import type { BoxParameters, BoxRowNoId, ContractType } from '$lib/types/boxRow';
import { ErgoAddress, ErgoTree, type Box } from '@fleet-sdk/core';
import { parse } from '@fleet-sdk/serializer';
import { mapBoxToProxyBoxRow } from './recognizer/proxyRecognizer';
import type { MaybeConfirmedOutput } from '$lib/types/parser';
import type { ConfirmedOutput } from '$lib/types/explorer';

export function maybeConfirmedOutputToBox(box: MaybeConfirmedOutput): Box {
	const newBox = JSON.parse(JSON.stringify(box));
	newBox.value = BigInt(newBox.value);
	return newBox;
}

export function parseBox(
	box: MaybeConfirmedOutput,
	getContractType = contractTypeFromErgoTree
): BoxRowNoId | undefined {
	const contractType = getContractType(box);
	if (contractType == 'DEPOSIT') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		if (r4 && r5) {
			return {
				box: maybeConfirmedOutputToBox(box),
				contract: 'DEPOSIT',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5
				},
				spent: !!(box as ConfirmedOutput).spentTransactionId
			};
		}
	} else if (contractType == 'BUY') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				box: maybeConfirmedOutputToBox(box),
				contract: 'BUY',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					tokenId: r6,
					buyRate: r7,
					buyerMultisigAddress: r8
				},
				spent: !!(box as ConfirmedOutput).spentTransactionId
			};
		}
	} else if (contractType == 'SELL') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				box: maybeConfirmedOutputToBox(box),
				contract: 'SELL',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					tokenId: r6,
					sellRate: r7,
					sellerMultisigAddress: r8
				},
				spent: !!(box as ConfirmedOutput).spentTransactionId
			};
		}
	} else if (contractType == 'SWAP') {
		const r4 = decodeR4(box);
		const r5 = decodeR5(box);
		const r6 = decodeTokenIdPairFromR6(box);
		const r7 = decodeR7(box);
		const r8 = decodeR8(box);
		const r9 = decodeR9(box);
		if (r4 && r5 && r6 && r7 && r8) {
			return {
				box: maybeConfirmedOutputToBox(box),
				contract: 'SWAP',
				parameters: {
					userPk: r4.userPk,
					poolPk: r4.poolPk,
					unlockHeight: r5,
					buyingTokenId: r6.buyingTokenId,
					sellingTokenId: r6.sellingTokenId,
					rate: r7,
					sellerMultisigAddress: r8,
					denom: r9,
					...pairAndSideByTokenIds(r6.sellingTokenId, r6.buyingTokenId)
				},
				spent: !!(box as ConfirmedOutput).spentTransactionId
			};
		}
	} else if (contractType == 'UNKNOWN') {
		return mapBoxToProxyBoxRow(box);
	}
}

export function contractTypeFromErgoTree(box: MaybeConfirmedOutput): ContractType {
	const address = new ErgoTree(box.ergoTree).toAddress().toString();
	if (address == DEPOSIT_ADDRESS) {
		return 'DEPOSIT';
	} else if (address == BUY_ORDER_ADDRESS) {
		return 'BUY';
	} else if (address == SELL_ORDER_ADDRESS) {
		return 'SELL';
	} else if (address == SWAP_ORDER_ADDRESS) {
		return 'SWAP';
	} else {
		return 'UNKNOWN';
	}
}

export function pairAndSideByTokenIds(
	tokenId: string,
	additionalTokenId: string = ''
): { pair: string; side: string } {
	let pair = tradingPairs.find(
		(pair) => pair.tokens.includes(tokenId) && pair.tokens.includes(additionalTokenId)
	);
	if (pair) {
		return {
			pair: pair.name,
			side: pair.tokens.indexOf(tokenId) == 0 ? 'SELL' : 'BUY'
		};
	} else {
		return {
			pair: '',
			side: 'SELL'
		};
	}
}

export function decodeR4(
	box: MaybeConfirmedOutput
): { userPk: string; poolPk: string } | undefined {
	const r4 = box.additionalRegisters.R4;

	if (r4) {
		const parsed = parse<Uint8Array[]>(r4);
		return {
			userPk: ErgoAddress.fromPublicKey(parsed[0]).toString(),
			poolPk: ErgoAddress.fromPublicKey(parsed[1]).toString()
		};
	}
}

export function decodeR5(box: MaybeConfirmedOutput): number | undefined {
	const r5 = box.additionalRegisters.R5;
	if (r5) {
		const parsed = parse<number>(r5);
		return parsed;
	}
}

export function decodeTokenIdFromR6(box: MaybeConfirmedOutput): string | undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = Buffer.from(parse(r6)).toString('hex');
		return parsed;
	}
}

export function decodeR7(box: MaybeConfirmedOutput): bigint | undefined {
	const r7 = box.additionalRegisters.R7;
	if (r7) {
		const parsed = parse<bigint>(r7);
		return parsed;
	}
}

export function decodeR8(box: MaybeConfirmedOutput): string | undefined {
	const r8 = box.additionalRegisters.R8;
	if (r8) {
		const hexBuffer = Buffer.from(parse(r8)).toString('hex');
		const parsed = ErgoAddress.fromErgoTree(hexBuffer).toString();
		return parsed;
	}
}

export function decodeR9(box: MaybeConfirmedOutput): bigint | undefined {
	const r9 = box.additionalRegisters.R9;
	if (r9) {
		const parsed = parse<bigint>(r9);
		return parsed;
	}
}

export function decodeTokenIdPairFromR6(box: MaybeConfirmedOutput):
	| {
			sellingTokenId: string;
			buyingTokenId: string;
	  }
	| undefined {
	const r6 = box.additionalRegisters.R6;
	if (r6) {
		const parsed = parse<Uint8Array[]>(r6);
		return {
			sellingTokenId: Buffer.from(parsed[0]).toString('hex'),
			buyingTokenId: Buffer.from(parsed[1]).toString('hex')
		};
	}
}
