import CryptoJS from 'crypto-js';
import { get, writable } from 'svelte/store';
import { wallet_initialized } from './ui_state';
import { showToast } from './header/toaster';
import { getChangeAddress } from '$lib/wallet/wallet';

export const crystalwallet_mnemonic = writable('');
export const crystalwallet_address = writable('');

export async function deleteWallet(){
	crystalwallet_mnemonic.set('');
	crystalwallet_address.set('');
	wallet_initialized.set(false);
	localStorage.removeItem('encryptedMnemonic');
	localStorage.removeItem('changeAddress');
	
	showToast('Wallet successfully  deleted!');
	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (worker) {
		return new Promise<void>((resolve) => {
			worker.postMessage({
				type: 'STORE_MNEMONIC',
				mnemonic: '',
				changeAddress: '',
			});
			resolve();
		});
	}
}

function encryptAndStoreMnemonic(mnemonic:string, changeAddress:string, password:string) {
	const decryptedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');;
	crystalwallet_mnemonic.set(decryptedMnemonic);
	crystalwallet_address.set(changeAddress);
	const encrypted = CryptoJS.AES.encrypt(decryptedMnemonic, password).toString();
	localStorage.setItem('encryptedMnemonic', encrypted);
	localStorage.setItem('changeAddress', encrypted);
}

export async function mnemonicRequiresDecryption() {
	return !!localStorage.getItem('encryptedMnemonic') && !get(crystalwallet_mnemonic);
}

function decryptLocalStorageMnemonic(password) {
	const encryptedMnemonic = localStorage.getItem('encryptedMnemonic');
	if (!encryptedMnemonic) {
		throw new Error('No encrypted mnemonic found');
	}
	const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, password);
	return decrypted.toString(CryptoJS.enc.Utf8);
}

export async function onDecrypt(password) {
	try {
		const decryptedMnemonic = decryptLocalStorageMnemonic(password);
		if(!(decryptedMnemonic.split(' ').length < 12)){
			return false;
		}
		let changeAddress = localStorage.getItem("changeAddress") ?? "";
		if(!changeAddress){
			changeAddress = await getChangeAddress(decryptedMnemonic);
		}
		showToast('Wallet unlocked.');
		crystalwallet_mnemonic.set(decryptedMnemonic);
		crystalwallet_address.set(changeAddress);
		wallet_initialized.set(true);

		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'STORE_MNEMONIC',
				mnemonic: decryptedMnemonic,
				changeAddress
			});
		}

		return true;
	} catch (error) {
		return false;
	}
}

export async function persistMnemonic(mnemonic: string, changeAddress:string, password: string): Promise<void> {
	encryptAndStoreMnemonic(mnemonic, changeAddress, password);
	wallet_initialized.set(true);

	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (!worker) {
		throw new Error('Service worker not active');
	}

	return new Promise<void>((resolve) => {
		worker.postMessage({
			type: 'STORE_MNEMONIC',
			mnemonic,
			changeAddress
		});
		resolve();
	});
}

async function getMnemonic(): Promise<{mnemonic:string, changeAddress:string}> {
	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (!worker) {
		return {mnemonic:"", changeAddress:""};
	}
	return new Promise((resolve) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = (event) => resolve(event.data);
		worker.postMessage({ type: 'RETRIEVE_MNEMONIC' }, [channel.port2]);
	});
}

export async function initMnemonicWorker() {
	await navigator.serviceWorker.register('/sw.js');
	const {mnemonic, changeAddress} = await getMnemonic();
	if (mnemonic) {
		crystalwallet_mnemonic.set(mnemonic);
		crystalwallet_address.set(changeAddress);
		wallet_initialized.set(true);
	}
}
