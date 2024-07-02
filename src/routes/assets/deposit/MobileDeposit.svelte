<script lang="ts">
    import DepositProxyQR from "./DepositProxyQR.svelte"
	let address = '9ffXZz5AovJvapPo63TGwdNaRPMUiHo2UkqGavmDGzrUERY9qJ3'
</script>

<div class="flex justify-center items-center">
    <div class="">
        <DepositProxyQR {address}></DepositProxyQR>
        <div class="mt-6"></div>
        <input class="ant-input ant-input-lg" style="width:300px;" value={address} />
    </div>
</div>