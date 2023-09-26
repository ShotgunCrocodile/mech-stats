<script setup lang="ts">
 import { ref, Ref } from 'vue';

 const props = defineProps<{
     value?: Ref<number>;
 }>();

 let value = props.value || ref(0);
 const up = () => { value.value = value.value + 1; };
 const down = () => { value.value = value.value - 1; };
</script>


<template>
    <div class="stack">
	<div class="clickable" @click="up">&#x25B2;</div>
	<div>{{ value }}</div>
	<div class="clickable" @click="down">&#x25BC;</div>
    </div>
</template>


<style scoped>

 .stack {
     display: grid;
     grid-auto-rows: 1fr;
     grid-row-gap: 2px;
 }

</style>
