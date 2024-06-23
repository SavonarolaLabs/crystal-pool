let decryptedMnemonic = '';

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STORE_MNEMONIC') {
        decryptedMnemonic = event.data.mnemonic;
    } else if (event.data && event.data.type === 'RETRIEVE_MNEMONIC') {
        event.ports[0].postMessage({ mnemonic: decryptedMnemonic });
    }
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
