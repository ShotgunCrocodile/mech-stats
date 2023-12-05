<script setup lang="ts">
 const props = defineProps(['filename', 'xmlContent']);
 const href = "data:text/xml;charset=utf-8," + encodeURIComponent(props.xmlContent);;
</script>

<template>
    <div class="button-container">
	<div class="filename">{{ props.filename }}</div>
	<a :href="href"
	   :download="props.filename">Download</a>
    </div>
</template>

<style scoped>
 .button-container {
     display: grid;
     grid-template-columns: 1fr auto;
     grid-column-gap: 1em;
     padding: 5px;
 }


</style>
