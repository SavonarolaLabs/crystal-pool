<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  // This should be your unsigned transaction from fleet-sdk
  export let unsignedTx

  let qrCodeDataUrl = '';

  function generateQRCode() {
    // Serialize the transaction to JSON
    const txJson = JSON.stringify(unsignedTx.toPlainObject());

    // Encode the JSON as base64
    const base64EncodedTx = btoa(txJson);

    // Create the ErgoPay URI´
    const ergoPayUri = `ergopay:${base64EncodedTx}`;

    // Generate QR code
    QRCode.toDataURL(ergoPayUri, {
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
    <img src={qrCodeDataUrl} alt="Ergo Transaction QR Code" />
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