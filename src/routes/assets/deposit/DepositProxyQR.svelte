<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'qrcode';

  export let address = '';
  let qrCodeDataUrl = '';

  function generateQRCode() {
    const ergoPayUrl = `ergopay:${address}`;

    QRCode.toDataURL(ergoPayUrl, {
      width: 300,
      margin: 0,
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
    <img src={qrCodeDataUrl} alt="Ergo Payment QR Code" />
{/if}

