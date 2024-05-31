import { describe, it, expect } from 'vitest';
import {
    compileSwapContract,
    compileDepositContract,
    compileBuyContract,
    compileSellContract
} from './compile';

describe('Contract Compilation', () => {
    it('should produce a valid address for swap-tokens.es', () => {
        const address = compileSwapContract();
        expect(address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{95,}$/);
    });

    it('should produce a valid address for deposit.es', () => {
        const address = compileDepositContract();
        expect(address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{95,}$/);
    });

    it('should produce a valid address for buy-token-for-erg.es', () => {
        const address = compileBuyContract();
        expect(address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{95,}$/);
    });

    it('should produce a valid address for sell-token-for-erg.es', () => {
        const address = compileSellContract();
        expect(address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{95,}$/);
    });
});
