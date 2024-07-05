import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import * as secp256k1 from '@noble/secp256k1';
import { DERIVATION_PATH } from '$lib/constants/ergo';
import { addressFromPk } from '$lib/utils/helper';

export function createMnemonic() {
    return bip39.generateMnemonic(wordlist);
}

export async function getChangeAddress(mnemonic: string) {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(`${DERIVATION_PATH}/0`);
    
    if (!derivedKey.privateKey) {
        throw new Error("Failed to derive private key");
    }
    
    const pk = secp256k1.getPublicKey(derivedKey.privateKey, true);
    return addressFromPk(Buffer.from(pk).toString('hex'));
}