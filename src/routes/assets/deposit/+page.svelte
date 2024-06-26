<script lang="ts">
	import {
		ErgoAddress,
		OutputBuilder,
		SAFE_MIN_BOX_VALUE,
		SColl,
		SGroupElement,
		SSigmaProp,
	} from '@fleet-sdk/core';
	import { ALICE_ADDRESS, BOB_ADDRESS, SHADOWPOOL_ADDRESS } from '$lib/constants/addresses';
	import ErgoPaymentQR from "./ErgoPaymentQR.svelte"
	import { first } from '@fleet-sdk/common';
	import { fetchHeight } from '$lib/external/height';
	import { deposit } from '$lib/wallet/deposit';
	import { TOKEN } from '$lib/constants/tokens';
	import { onMount } from 'svelte';

	const inputs = [
		{
			boxId: 'a09c1f5d2b60af6a61ceab8e3ea108684ce9f2b67988537b25c084c2e3321964',
			value: '988700000',
			ergoTree: '0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c',
			creationHeight: 1284140,
			assets: [
				{
					tokenId: 'f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a', // sigUSD
					amount: '50000000000'
				},
				{
					tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
					amount: '1999999899970000'
				},
				{
					tokenId: 'bd0c25c373ad606d78412ae1198133f4573b4e4c2d4ed3fc4c2a4547c6c6e12e',
					amount: '1000'
				},
				{
					tokenId: 'fffe6122886e3b0ab9b72b401b39bf8d3f13580c1335a41d91d19deb8038ccd4',
					amount: '1000000000000'
				},
				{
					tokenId: 'd2d0deb3b0b2c511e523fd43ae838ba7b89e4583f165169b90215ff11d942c1f',
					amount: '49000000000000000'
				},
				{
					tokenId: '3f61f140d3fe334a845df647245a9e534337458f976a9d2a32ce4a7a3ee89232',
					amount: '1'
				},
				{
					tokenId: '69feaac1e621c76d0f45057191ba740c2b4aa1ca28aff58fd889d071a0d795b8',
					amount: '47997989999998290'
				},
				{
					tokenId: '471eec389bebd266b5be1163451775d15c22df12af911e8ff0b919b60c862bae',
					amount: '1'
				},
				{
					tokenId: '61e8c9d9cb5975fb4f54eec7d62286febcd58aba97cf6798691e3acc728cf3d1',
					amount: '1'
				},
				{
					tokenId: '2b4e0c286b470a9403c10fe557c58c1b5b678a2078b50d28baad0629e237e69c',
					amount: '1'
				},
				{
					tokenId: '2b1d40e38098e666740177c9f296a6ec8898c9a28c645576cca37e0449402a09',
					amount: '1'
				},
				{
					tokenId: '74648d5d515e37fd578e3fbe7aa0764f5edd27e0c311d82ffcd5596934daf431',
					amount: '1'
				},
				{
					tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
					amount: '50'
				}
			],
			additionalRegisters: {},
			transactionId: '089d1af5f67da97b0bafc5affc58a3c1e444a9965688e1b5efc3e4d58d4e9b0e',
			index: 2,
			confirmed: true
		}
	];

  async function tx(){
    let height = await fetchHeight();
    return deposit(height, inputs, BOB_ADDRESS, BOB_ADDRESS, 1_400_000, [
      { tokenId: TOKEN.sigUSD.tokenId, amount: '100'}
    ], SAFE_MIN_BOX_VALUE);
  };

</script>

{#await tx()}
	building tx
{:then unsignedTx} 
	<ErgoPaymentQR {unsignedTx} />
	
{/await}
