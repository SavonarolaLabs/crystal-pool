<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  export let recipientAddress = '';
  export let tokenId;
  export let tokenAmount;
  export let amount;

  let qrCodeDataUrl = '';

  $: if (recipientAddress, tokenId, tokenAmount) {
    generateQRCode();
  }

  function encodeURIComponent(str: string): string {
    return encodeURIComponent(str).replace(/%20/g, '+');
  }

  async function generateQRCode() {
    let uri = `ergo:${recipientAddress}?amount=${amount}&token-${tokenId}=${tokenAmount}`;

    //if (amount) params.push(`amount=${amount}`);

    try {
      qrCodeDataUrl = await QRCode.toDataURL(uri, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
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