export const TOKEN = {
	rsBTC: {
		tokenId:
			'5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
		name: 'rsBTC',
		decimals: 9,
		type: 'EIP-004'
	},
	sigUSD: {
		tokenId:
			'03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
		name: 'SigUSD', //?
		decimals: 2, //?
		type: 'EIP-004'
	}
};

export const tradingPairs = [
	{
		name: 'rsBTC_SigUSD',
		tokens: [TOKEN.rsBTC.tokenId, TOKEN.sigUSD.tokenId]
	}
];
