export const TOKEN = {
	rsBTC: {
		tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
		name: 'rsBTC',
		decimals: 9,
		type: 'EIP-004'
	},
	sigUSD: {
		tokenId: 'f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a',
		name: 'sigUSD',
		decimals: 2,
		type: 'EIP-004'
	}
};

export const pairName = {
	rsBTC_sigUSD: 'rsBTC_sigUSD'
};

export const tradingPairs = [
	{
		name: pairName.rsBTC_sigUSD,
		tokens: [TOKEN.rsBTC.tokenId, TOKEN.sigUSD.tokenId]
	}
];
