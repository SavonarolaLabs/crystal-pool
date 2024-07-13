import type { ExplorerTransaction } from '$lib/types/explorer';
import { nautilusBox } from './box';

export async function fetchTransaction(txId): Promise<ExplorerTransaction | false> {
	const url = `https://api.ergoplatform.com/api/v1/transactions/${txId}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Error fetching transaction: ${response.statusText}`);
		}
		const data: ExplorerTransaction = await response.json();

		data.inputs = data.inputs.map(nautilusBox);
		data.outputs = data.outputs.map(nautilusBox);
		return data;
	} catch (error) {
		console.error('Error:', error);
		return false;
	}
}
