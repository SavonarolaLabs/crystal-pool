import type { ConfirmedTransaction, UnconfirmedTransaction } from '$lib/types/explorer';
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
			throw new Error(`Error fetching unconfirmed transaction: ${response.statusText}`);
		}
		const data: UnconfirmedTransaction = await response.json();

		data.inputs = data.inputs.map(nautilusBox);
		data.outputs = data.outputs.map(nautilusBox);
		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}
