import {
	ALICE_ADDRESS,
	BOB_ADDRESS,
	DEPOSIT_ADDRESS,
	SELL_ORDER_ADDRESS
} from '../constants/addresses';
import { getContractBoxes } from './box';

let utxo = {};
utxo[ALICE_ADDRESS] = await getContractBoxes(ALICE_ADDRESS);
utxo[BOB_ADDRESS] = await getContractBoxes(BOB_ADDRESS);
utxo[DEPOSIT_ADDRESS] = await getContractBoxes(DEPOSIT_ADDRESS);
utxo[SELL_ORDER_ADDRESS] = await getContractBoxes(SELL_ORDER_ADDRESS);

console.log('export const utxos = ');
console.dir(utxo, { depth: null });
