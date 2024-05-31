const CRYSTALPOOL_URL = 'http://127.0.0.1:3000';
const NEW_SWAP_REQUEST = '/swap-order';
const NEW_SWAP_SIGN = '/swap-order/sign';
const ORDER_BOOK = '/order-book/';
const USER_BOXES = '/user-boxes/';

export async function get(address: string) {
    let res = await fetch(CRYSTALPOOL_URL + address, {
        headers: {
            'Content-Type': 'application/json'
        },
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

export async function createSwapTx(swapParams: any): Promise<{ unsignedTx:any, publicCommitsPool:any }>{
    return await post(
        NEW_SWAP_REQUEST,
        swapParams
    );
}

export async function signSwapTx(extractedHints: any, unsignedTx: any): Promise<any>{
    return await post(NEW_SWAP_SIGN, {
        extractedHints,
        unsignedTx
    });
}

export async function orderBook(pair: string): Promise<any>{
    return await get(ORDER_BOOK + pair);
}

export async function userBoxes(address: string): Promise<any>{
    return await get(USER_BOXES + address);
}
