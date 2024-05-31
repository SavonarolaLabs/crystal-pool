import fs from 'fs';
import path from 'path';
import {
    compileBuyContract,
    compileDepositContract,
    compileSellContract,
    compileSwapContract
} from '$lib/compiler/compile';

// Function to compile a contract and return its address, or an empty string if it fails
const safeCompile = (compileFn: () => string): string => {
    try {
        return compileFn();
    } catch {
        return '';
    }
};

// Addresses object with the compiled contract addresses
const addresses = {
    DEPOSIT_ADDRESS: safeCompile(compileDepositContract),
    SELL_ORDER_ADDRESS: safeCompile(compileSellContract),
    BUY_ORDER_ADDRESS: safeCompile(compileBuyContract),
    SWAP_ORDER_ADDRESS: safeCompile(compileSwapContract),
};

// Path to the addresses file
const addressesFilePath = path.join(__dirname, '../constants/addresses.ts');

// Read the content of the addresses file
let fileContent = fs.readFileSync(addressesFilePath, 'utf-8');

// Update the addresses in the file content
for (const [key, value] of Object.entries(addresses)) {
    const regex = new RegExp(`(${key}\\s*=\\s*")[^"]*(";)`);
    fileContent = fileContent.replace(regex, `$1${value}$2`);
}

// Write the updated content back to the file
fs.writeFileSync(addressesFilePath, fileContent, 'utf-8');