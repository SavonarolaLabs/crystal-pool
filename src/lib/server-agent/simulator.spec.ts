import { describe, expect, it } from "vitest";
import { initDeposits } from "./simulator";

describe('Simulate deposit', ()=>{
    it('creates 2 depost boxes', async()=>{
        const depostBoxes = await initDeposits();
        expect(depostBoxes.length, 'amount of deposit boxes').toBe(2)
    })
})