<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  export let recipientAddress: string;
  export let amount: string; // in nanoERG
  export let registers: { [key: string]: string } = {}; // Custom registers
  export let tokens: { [tokenId: string]: string } = {}; // Optional: for token transfers

  let qrCodeDataUrl = '';

  function generateQRCode() {
    const txRequest = {
      address: recipientAddress,
      amount: parseInt(amount),
      registers: registers,
      tokens: Object.entries(tokens).map(([tokenId, amount]) => ({
        tokenId,
        amount: parseInt(amount)
      }))
    };

    const jsonRequest = JSON.stringify(txRequest);
    const base64Request = btoa(jsonRequest);
    const ergoPayUrl = `ergopay:${base64Request}`;

    QRCode.toDataURL(ergoPayUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
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