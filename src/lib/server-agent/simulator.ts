import { TOKEN } from "$lib/constants/tokens";
import { depositAlice } from "./alice";
import { depositBob } from "./bob";

export async function initDeposits(){
    const fiveErg = 5n * 10n ** 9n;
    const aliceDeposits = await depositAlice(
        { tokenId: TOKEN.sigUSD.tokenId, amount: BigInt(70 * 10 ** 4 * 10 ** 2) },
        fiveErg
    );
    const bobDeposits = await depositBob(
        { tokenId: TOKEN.rsBTC.tokenId, amount: BigInt(10 * 10 ** 9) },
        fiveErg
    );
    return [...aliceDeposits, ...bobDeposits]
}