import { Network } from '@fleet-sdk/common';
import { compile } from '@fleet-sdk/compiler';
import fs from 'fs';
import path from 'path';

function compileContract(contract: string) {
    const tree = compile(contract, {
        version: 0,
        includeSize: false
    });
    return tree.toAddress(Network.Mainnet).toString();
}

function compileContractFromFile(fileName: string){
    const contractFile = path.join(__dirname, '../contracts', fileName);
    const contract = fs.readFileSync(contractFile, 'utf-8');
    return compileContract(contract);
}

export function compileDepositContract(){
    return compileContractFromFile('deposit.es')
}

export function compileBuyContract(){
    return compileContractFromFile('buy-token-for-erg.es')
}

export function compileSellContract(){
    return compileContractFromFile('sell-token-for-erg.es')
}

export function compileSwapContract(){
    return compileContractFromFile('swap-tokens.es')
}

