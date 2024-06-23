import CryptoJS from 'crypto-js';
import { writable } from 'svelte/store';

export const mnemonic = writable('');

function encryptAndStoreMnemonic(m, password) {
	const decryptedMnemonic = m;
	mnemonic.set(decryptedMnemonic);
	const encrypted = CryptoJS.AES.encrypt(decryptedMnemonic, password).toString();
	localStorage.setItem('encryptedMnemonic', encrypted);
}

function decryptMnemonic(password) {
	const encryptedMnemonic = localStorage.getItem('encryptedMnemonic');
	if (!encryptedMnemonic) {
		throw new Error('No encrypted mnemonic found');
	}
	const decrypted = CryptoJS.AES.decrypt(encryptedMnemonic, password);
	return decrypted.toString(CryptoJS.enc.Utf8);
}

export function onDecrypt(password) {
	try {
		const decryptedMnemonic = decryptMnemonic(password);
		mnemonic.set(decryptedMnemonic);
		sessionStorage.setItem('decryptedMnemonic', decryptedMnemonic);

		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'STORE_MNEMONIC',
				mnemonic: decryptedMnemonic
			});
		}
	} catch (error) {
		console.error('Decryption failed:', error);
	}
}


export async function setMnemonic(m: string, password: string): Promise<void> {
	mnemonic.set(m);
    encryptAndStoreMnemonic(m, password);

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
	console.log('m', m);
	if (m) {
		mnemonic.set(m);
	}
}
