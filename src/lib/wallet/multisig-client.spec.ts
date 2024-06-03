import { Propositions } from "ergo-lib-wasm-nodejs";
import { describe, expect, it } from "vitest";

describe('multisig client', ()=>{
	it('arrayToProposition works', () => {
		const a = arrayToProposition([]);
		expect(a.__wbg_ptr).toBeDefined();
	})
})

function arrayToProposition(input: Array<string>): Propositions {
	const output = new Propositions();
	input.forEach((pk) => {
		const proposition = Uint8Array.from(Buffer.from('cd' + pk, 'hex'));
		output.add_proposition_from_byte(proposition);
	});
	return output;
}