<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
  
	const TOKEN = {
	  sigUSD: {
		tokenId: '03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'
	  }
	};
  
	let address = '9ewA9T53dy5qvAkcR5jVCtbaDW2XgWzbLPs5H4uCJJavmA4fzDx';
	let amount = '0.001';
	let registers = {
	  R4: '0e201',
	  R5: '0e201'
	};
	let tokens = {
	  [TOKEN.sigUSD.tokenId]: '100'
	};
  
	let qrCodeDataUrl = '';
  
	function generateQRCode() {
	  const txRequest = {
		address: address,
		amount: (parseFloat(amount) * 1e9).toString(), // Convert ERG to nanoERG as string
		registers: registers,
		assets: [
		  {
			tokenId: TOKEN.sigUSD.tokenId,
			amount: tokens[TOKEN.sigUSD.tokenId]
		  }
		]
	  };
  
	  const jsonRequest = JSON.stringify(txRequest);
	  const base64Request = btoa(jsonRequest);
	  const ergoPayUrl = `ergopay:${base64Request}`;
  
	  QRCode.toDataURL(ergoPayUrl, {
		width: 300,
		margin: 1,
		errorCorrectionLevel: 'L'
	  }).then(url => {
		qrCodeDataUrl = url;
	  }).catch(err => {
		console.error('Error generating QR code:', err);
	  });
	}
  
	onMount(() => {
	  generateQRCode();
	});
  </script>
  
  {#if qrCodeDataUrl}
	<div class="qr-code-container">
	  <img src={qrCodeDataUrl} alt="Ergo Payment QR Code" />
	</div>
  {/if}
  
  <style>
	.qr-code-container {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  margin: 20px 0;
	}
  </style>