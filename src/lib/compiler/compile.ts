import { BOB_ADDRESS, DEPOSIT_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
import { SAFE_MIN_FEE_VALUE } from '$lib/constants/ergo';
import { first, Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';
import { ErgoAddress } from '@fleet-sdk/core';
import { SByte, SColl, SGroupElement, SInt, SLong, SSigmaProp } from '@fleet-sdk/serializer';
import fs from 'fs';
import path from 'path';

export function compileContract(contract: string, map = {}) {
	const tree = compile(contract, {
		map,
		version: 0,
		includeSize: false
	});
	return tree.toAddress(Network.Mainnet).toString();
}

function compileContractFromFile(fileName: string) {
	const contractFile = path.join(__dirname, '../contracts', fileName);
	const contract = fs.readFileSync(contractFile, 'utf-8');
	return compileContract(contract);
}

export function compileDepositContract() {
	return compileContractFromFile('deposit.es');
}

export function compileDepositProxyContract(userPk, unlockHeight, minerFee = SAFE_MIN_FEE_VALUE) {
	const contractFile = path.join(__dirname, '../contracts', 'deposit-proxy.es');
	const contract = fs.readFileSync(contractFile, 'utf-8');
	return compileContract(contract, {
		_depositAddress: SColl(SByte, ErgoAddress.fromBase58(DEPOSIT_ADDRESS).ergoTree).toHex(),
		_userPk: SColl(SByte, ErgoAddress.fromBase58(userPk).ergoTree).toHex(),
		_poolPk: SColl(SByte, ErgoAddress.fromBase58(SHADOWPOOL_ADDRESS).ergoTree).toHex(),
		_unlockHeight: SInt(unlockHeight).toHex(),
		_minerFee: SLong(unlockHeight).toHex()
	});
}

export function compileBuyContract() {
	return compileContractFromFile('buy-token-for-erg.es');
}

export function compileSellContract() {
	return compileContractFromFile('sell-token-for-erg.es');
}

export function compileSwapContract() {
	return compileContractFromFile('swap-tokens.es');
}
