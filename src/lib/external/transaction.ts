import type { ConfirmedTransaction, UnconfirmedTransaction } from '$lib/types/explorer';
import type { TransactionNode } from '$lib/types/node';
import type { SignedTransaction, TransactionId } from '@fleet-sdk/common';
import { nautilusBox } from './box';

export async function fetchConfirmedTransaction(
	txId: string
): Promise<ConfirmedTransaction | false> {
	const url = `https://api.ergoplatform.com/api/v1/transactions/${txId}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Error fetching transaction: ${response.statusText}`);
		}
		const data: ConfirmedTransaction = await response.json();

		data.inputs = data.inputs.map(nautilusBox);
		data.outputs = data.outputs.map(nautilusBox);
		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}

export async function fetchUnconfirmedTransaction(
	txId: string
): Promise<UnconfirmedTransaction | false> {
	const url = `https://api.ergoplatform.com/transactions/unconfirmed/${txId}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			//throw new Error(`Error fetching unconfirmed transaction: ${response.statusText}`);
			return false;
		}
		const data: UnconfirmedTransaction = await response.json();

		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}

export async function fetchUnconfirmedTransactionFromErgoNode(
	txId: TransactionId
): Promise<TransactionNode | false> {
	const url = `http://213.239.193.208:9053/transactions/unconfirmed/byTransactionId/${txId}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			return false;
		}
		const data: TransactionNode = await response.json();
		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}

const servers = [
	'https://gql.ergoplatform.com/',
	'https://graphql.erg.zelcore.io/',
	'https://explore.sigmaspace.io/api/graphql'
];

export async function sendTx(signedTx: UnconfirmedTransaction | SignedTransaction): Promise<string> {
	const query = `
	  mutation Mutation($signedTransaction: SignedTransaction!) {
		submitTransaction(signedTransaction: $signedTransaction)
	  }
	`;

	for (const server of servers) {
		try {
			const response = await fetch(server, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: query,
					variables: {
						signedTransaction: signedTx
					}
				})
			});

			const result = await response.json();
			if (!result.errors && result.data?.submitTransaction) {
				return result.data.submitTransaction;
			}
		} catch {
			// Pokemon
			return ''
		}
	}

	return '';
}
