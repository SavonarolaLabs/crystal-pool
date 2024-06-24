import CryptoJS from 'crypto-js';
import { get, writable } from 'svelte/store';
import { wallet_initialized } from './ui_state';
import { showToast } from './header/toaster';

export const mnemonic = writable('');

export async function deleteWallet(){
	mnemonic.set('');
	wallet_initialized.set(false);
	localStorage.removeItem('encryptedMnemonic');
	
	showToast('Wallet successfully  deleted!');
	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (worker) {
		return new Promise<void>((resolve) => {
			worker.postMessage({
				type: 'STORE_MNEMONIC',
				mnemonic: ''
			});
			resolve();
		});
	}
}

function encryptAndStoreMnemonic(m, password) {
	const decryptedMnemonic = m.trim().replace(/\s+/g, ' ');;
	mnemonic.set(decryptedMnemonic);
	const encrypted = CryptoJS.AES.encrypt(decryptedMnemonic, password).toString();
	localStorage.setItem('encryptedMnemonic', encrypted);
}

export async function mnemonicRequiresDecryption() {
	return !!localStorage.getItem('encryptedMnemonic') && !get(mnemonic);
}

function decryptLocalStorageMnemonic(password) {
	const encryptedMnemonic = localStorage.getItem('encryptedMnemonic');
	if (!encryptedMnemonic) {
		throw new Error('No encrypted mnemonic found');
	}
	const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, password);
	return decrypted.toString(CryptoJS.enc.Utf8);
}

export function onDecrypt(password) {
	try {
		const decryptedMnemonic = decryptLocalStorageMnemonic(password);
		if(!(decryptedMnemonic.split(' ').length == 12)){
			return false;
		}

		showToast('Wallet unlocked.');
		mnemonic.set(decryptedMnemonic);
		wallet_initialized.set(true);

		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'STORE_MNEMONIC',
				mnemonic: decryptedMnemonic
			});
		}

		return true;
	} catch (error) {
		return false;
	}
}

export async function persistMnemonic(m: string, password: string): Promise<void> {
	mnemonic.set(m);
	encryptAndStoreMnemonic(m, password);
	wallet_initialized.set(true);

	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (!worker) {
		throw new Error('Service worker not active');
	}

	return new Promise<void>((resolve) => {
		worker.postMessage({
			type: 'STORE_MNEMONIC',
			mnemonic: m
		});
		resolve();
	});
}

async function getMnemonic(): Promise<string> {
	const registration = await navigator.serviceWorker.ready;
	const worker = registration.active;
	if (!worker) {
		return '';
	}
	return new Promise((resolve) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = (event) => resolve(event.data.mnemonic);
		worker.postMessage({ type: 'RETRIEVE_MNEMONIC' }, [channel.port2]);
	});
}

export async function initMnemonicWorker() {
	await navigator.serviceWorker.register('/sw.js');
	const m = await getMnemonic();
	if (m) {
		mnemonic.set(m);
		wallet_initialized.set(true);
	}
}
