<script setup lang="ts">
 const props = defineProps<{
     url: string,
 }>();
</script>

<template>
    <div class="item">
	<h2>
	    <a v-bind:href="props.url" class="link">
		<slot name="link"></slot>
	    </a>
	</h2>
	<div class="text">
	    <slot name="text"></slot>
	</div>
    </div>
</template>


<style scoped>
 .item {
     background-color: var(--color-background-soft);
     padding: 1em;
 }

 .link {
     color: var(--color-heading);
 }
</style>
