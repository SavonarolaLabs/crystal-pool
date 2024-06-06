import { describe, expect, it } from 'vitest';
import { Transaction, UnsignedTransaction } from 'ergo-lib-wasm-nodejs';

describe('test', () => {
	let unsignedTx = {
		inputs: [
			{
				boxId: 'dda017f4a820cf987ef71598834e5e9d7d3f3bc7a4a5276b699eefd2a08d3d6c',
				value: '5000000000',
				ergoTree:
					'10010400d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7da720101a7',
				creationHeight: 1277300,
				assets: [
					{
						tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '10000000000'
					}
				],
				additionalRegisters: {
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R5: '04c0d89e01'
				},
				transactionId: '45043ec3f9a5d4391681a10f50bc57b98654802aad425a15b37facaefe743c93',
				index: 0,
				extension: {}
			}
		],
		dataInputs: [],
		outputs: [
			{
				value: '1000000',
				ergoTree:
					'100f010004000402040004000500050004000500050005000400050005000500d81dd601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d9010863ed937206da720501720893da720701a7da7207017208d609d9010963937202da7201017209d60a830002d60b8602720a720ad60cd9010c638ce5c6720c063c0e0e720b01d60dda720c01a7d60ed9010e638ce5c6720e063c0e0e720b02d60fd9010f638cb2db6308720f73030001d610d9011063e4c672100705d611d9011163e4c67211080ed612da721101a7d613d9011363ededededededdad901156393c27215c2a7017213da7208017213da7209017213dad9011563ed93720dda720c01721593da720e01a7da720e017215017213dad9011563eded93720dda720c01721591b1db63087215730493720dda720f017215017213dad901156391da72100172157305017213dad9011563937212da7211017215017213d614b5a47213d615d9011563e4c672150905d616b072147306d901164163d802d6188c721601d619da7215018c72160295917218721972187219d617da720e01a7d618d90118638cb2db6308721873070002d619d9011941639a8c721901da7218018c721902d61ad9011a639d9cda721001721a7216da721501721ad61bd9011b63edda721301721bdad9011d63939cda721001721d72169cda721501721db072147308d9011f4163d802d6218c721f01d622da721a018c721f029591722172227221722201721bd61c997edad9011c0c63b0b5721c72137309721901a4067edad9011c0c63b0b5721c721b730a721901a506d61dd9011d4163d801d61f8c721d029a8c721d019cda721801721fda721a01721f9591a372027206d801d61eda720701a7eb02ea027206721eea02d1929d9c7e7216067edad9011f0c63b0b5721fd9012163edededda7208017221da7209017221dad9012363eded937217da720e01722391b1db63087223730b937217da720f017223017221937212c27221730c721901a506721c9d997eb07214730d721d067eb0b5a5721b730e721d06721c721e',
				creationHeight: 1273521,
				assets: [
					{
						tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '10000'
					}
				],
				additionalRegisters: {
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R5: '04c0d89e01',
					R6: '3c0e0e205bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d20f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a',
					R7: '0504',
					R8: '0e3010010400d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7da720101a7',
					R9: '05d00f'
				}
			},
			{
				value: '4997900000',
				ergoTree:
					'10010400d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7da720101a7',
				creationHeight: 1273521,
				assets: [
					{
						tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '9999990000'
					}
				],
				additionalRegisters: {
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R5: '04c0d89e01'
				}
			},
			{
				value: '1100000',
				ergoTree:
					'1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
				creationHeight: 1273521,
				assets: [],
				additionalRegisters: {}
			}
		]
	};

	let signedTx = {
		id: '37723bc27ee6d346e907418bb3f0be9c1518b5c998c3c64562e733aef4acf68e',
		inputs: [
			{
				boxId: 'dda017f4a820cf987ef71598834e5e9d7d3f3bc7a4a5276b699eefd2a08d3d6c',
				spendingProof: {
					proofBytes:
						'f7241930036527f30cfb3577f1e7f0f6d24446568333bab1ea042d8349f0bd24ed28f93ddfe136f02c67b6f6474ec647c828f67bf7d17e65',
					extension: {}
				}
			}
		],
		dataInputs: [],
		outputs: [
			{
				boxId: 'c9c6c974a9cd7da649620bd0159f95f763668469990592cc8f14635df0cc6383',
				value: '1000000',
				ergoTree:
					'100f010004000402040004000500050004000500050005000400050005000500d81dd601d9010163e4c672010504d602da720101a7d603d17300d60483020872037203d605d9010563b2e5c6720504147204730100d606da720501a7d607d9010763b2e5c6720704147204730200d608d9010863ed937206da720501720893da720701a7da7207017208d609d9010963937202da7201017209d60a830002d60b8602720a720ad60cd9010c638ce5c6720c063c0e0e720b01d60dda720c01a7d60ed9010e638ce5c6720e063c0e0e720b02d60fd9010f638cb2db6308720f73030001d610d9011063e4c672100705d611d9011163e4c67211080ed612da721101a7d613d9011363ededededededdad901156393c27215c2a7017213da7208017213da7209017213dad9011563ed93720dda720c01721593da720e01a7da720e017215017213dad9011563eded93720dda720c01721591b1db63087215730493720dda720f017215017213dad901156391da72100172157305017213dad9011563937212da7211017215017213d614b5a47213d615d9011563e4c672150905d616b072147306d901164163d802d6188c721601d619da7215018c72160295917218721972187219d617da720e01a7d618d90118638cb2db6308721873070002d619d9011941639a8c721901da7218018c721902d61ad9011a639d9cda721001721a7216da721501721ad61bd9011b63edda721301721bdad9011d63939cda721001721d72169cda721501721db072147308d9011f4163d802d6218c721f01d622da721a018c721f029591722172227221722201721bd61c997edad9011c0c63b0b5721c72137309721901a4067edad9011c0c63b0b5721c721b730a721901a506d61dd9011d4163d801d61f8c721d029a8c721d019cda721801721fda721a01721f9591a372027206d801d61eda720701a7eb02ea027206721eea02d1929d9c7e7216067edad9011f0c63b0b5721fd9012163edededda7208017221da7209017221dad9012363eded937217da720e01722391b1db63087223730b937217da720f017223017221937212c27221730c721901a506721c9d997eb07214730d721d067eb0b5a5721b730e721d06721c721e',
				assets: [
					{
						tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '10000'
					}
				],
				additionalRegisters: {
					R5: '04c0d89e01',
					R9: '05d00f',
					R6: '3c0e0e205bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d20f60bff91f7ae3f3a5f0c2d35b46ef8991f213a61d7f7e453d344fa52a42d9f9a',
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551',
					R8: '0e3010010400d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7da720101a7',
					R7: '0504'
				},
				creationHeight: 1273521,
				transactionId: '37723bc27ee6d346e907418bb3f0be9c1518b5c998c3c64562e733aef4acf68e',
				index: 0
			},
			{
				boxId: 'f0f8fde8a1997ada689617d9b374b40f3e2ec2cc78df93a4a9eb8a8b23613757',
				value: '4997900000',
				ergoTree:
					'10010400d801d601d9010163b2e4c6720104147300009591a3dad9010263e4c67202050401a7da720101a7da720101a7',
				assets: [
					{
						tokenId: '5bf691fbf0c4b17f8f8cece83fa947f62f480bfbd242bd58946f85535125db4d',
						amount: '9999990000'
					}
				],
				additionalRegisters: {
					R5: '04c0d89e01',
					R4: '1402cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2ccd025d163103d491a5193c7b18182442877ce8fcf3ffb9ae9c295d9c98a16dcb0551'
				},
				creationHeight: 1273521,
				transactionId: '37723bc27ee6d346e907418bb3f0be9c1518b5c998c3c64562e733aef4acf68e',
				index: 1
			},
			{
				boxId: 'e4dc904c2f377510184aaeaa42bdde0884a7bf5dc2cc99f026dc60cde49aa8c3',
				value: '1100000',
				ergoTree:
					'1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
				assets: [],
				additionalRegisters: {},
				creationHeight: 1273521,
				transactionId: '37723bc27ee6d346e907418bb3f0be9c1518b5c998c3c64562e733aef4acf68e',
				index: 2
			}
		]
	};

	it('can be hashed', () => {
		//input -> inputs

		const proof = signedTx.inputs[0].spendingProof.proofBytes;
		//unsignedTx.inputs[0].spendingProof.proofBytes = proof;

		function getNewTransactionFromProofs(unsignedTx, proofs) {
			const uint8arrays = proofs.map(hexStringToUint8Array);
			const wasmUnsigned = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
			const transaction = Transaction.from_unsigned_tx(wasmUnsigned, uint8arrays);
			return transaction;
		}

		function hexStringToUint8Array(hexString) {
			if (hexString.length % 2 !== 0) {
				throw new Error('Invalid hex string');
			}

			const array = new Uint8Array(hexString.length / 2);

			for (let i = 0; i < hexString.length; i += 2) {
				array[i / 2] = parseInt(hexString.substr(i, 2), 16);
			}

			return array;
		}

		// Example usage:
		const transaction = getNewTransactionFromProofs(unsignedTx, [proof]);

		// const uint8Array = hexStringToUint8Array(proof);
		// const wasmUnsigned = UnsignedTransaction.from_json(JSON.stringify(unsignedTx));
		// const transaction = Transaction.from_unsigned_tx(wasmUnsigned, [uint8Array]);

		for (let i = 0; i < signedTx.outputs.length; i++) {
			expect(signedTx.outputs[i].boxId).toBe(transaction.to_js_eip12().outputs[i].boxId);
		}

		console.log(signedTx.outputs.map((b) => b.boxId));
		console.log(transaction.to_js_eip12().outputs.map((b) => b.boxId));
	});
});

// import {
// 	Address,
// 	ErgoBoxCandidate,
// 	ErgoBoxCandidates,
// 	ErgoBoxes,
// 	ErgoTransaction,
// 	UnsignedErgoTransaction,
// 	UnsignedInput
// } from 'ergoscript';

// // Пример данных транзакции
// const transactionId = 'f2da249215f52e602837dbf9aa538d6a36b372c61bf30e254692382c55e37f68';
// const inputs = [
// 	{
// 		boxId: '3d2bdc60055544031e97d8ca8ffac4719bf1fbdcd6dbeda18bdf04dece294a1f',
// 		value: 679127917788,
// 		index: 0,
// 		spendingProof:
// 			'25eb468762c2b1c2f9777f9f65d21df45b3311e0cf38be516e5dfe527d3af73dda2d50bffffcadddda99dd6f8b93f472e74e1f96189f1861'
// 	}
// ];

// const outputs = [
// 	{
// 		value: 5000000000,
// 		address: '9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU'
// 	},
// 	{
// 		value: 1100000,
// 		address:
// 			'2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe'
// 	},
// 	{
// 		value: 674126817788,
// 		address: '9fFiJiBxsoozEc9Rn1AcmUBZ2zdKjtcRg6Ft45qAS7un2M7pcuk'
// 	}
// ];

// // Создание боксов
// const inputBoxes = inputs.map((input) => new UnsignedInput(input.boxId));
// const outputBoxes = outputs.map(
// 	(output, index) => new ErgoBoxCandidate(output.value, Address.fromBase58(output.address), 0)
// );

// // Создание транзакции
// const unsignedTx = new UnsignedErgoTransaction(
// 	new ErgoBoxes(inputBoxes),
// 	new ErgoBoxCandidates(outputBoxes),
// 	[]
// );

// // Получение идентификатора транзакции и boxId для выходов
// const txId = unsignedTx.id();
// unsignedTx.outputs().forEach((output, index) => {
// 	console.log(`BoxId ${index}: ${output.boxId()}`);
// });

// получилось:
// BoxId 0: cc2e3a63889dfa756073ca8b945781d80ba6299c65113b1c0b977755b469a911
// BoxId 1: 76e4206ed599d16925bc58bc910e46cbbd74f020a450f991a3eea3ebe817d6bd
// BoxId 2: 5c0768dacbbe5351447850cb7228721bddc9aef6a13a8c1c45754f50e5cf6239

// а должно получится:
// BoxId 0: 04f1c9ab87c0bab57c63029d2fedf4bd06d2ae3765e5c2b400055159c4526ce9
// BoxId 1: 9d79be618b49f3e6697bda876e9ba88dc5bae531a16a530ab3514b3cdbf5a20a
// BoxId 2: bd9dd9d65431946df8180e3527f8cc3eeee4adbbef2507cddd29e088d8b5e415

// точно ли не должны использоваться дополнительные параметры при генерации BoxId, у каждого инпута например есть spendingProof
