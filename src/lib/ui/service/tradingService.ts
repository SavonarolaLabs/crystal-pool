import { get } from "svelte/store";
import { createSwapTx, signSwapTx } from "./crystalPoolService";
import { user_address, user_mnemonic } from "../ui_state";
import { b } from "$lib/wallet/multisig-client";

export type SwapRequest = {
    address: string;
    price: string;
    amount: string;
    sellingTokenId: string;
    buyingTokenId: string;
};

export async function createAndMultisigSwapTx(swapParams: SwapRequest) {
    const { unsignedTx, publicCommitsPool } = await createSwapTx(swapParams);

    const extractedHints = await b(
        unsignedTx,
        get(user_mnemonic),
        get(user_address),
        publicCommitsPool
    );

    let signedTx = await signSwapTx(extractedHints, unsignedTx);
    return signedTx;
}