<script setup lang="ts">
 import { ref, Ref } from 'vue';

 const props = defineProps<{
     startValue?: number;
     value?: Ref<number>;
     update?: (oldValue: number, newValue: number, delta: number) => number;
     minimum?: number;
     maximum?: number;
 }>();

 let value = props.value || ref(props.startValue || ref(0));
 let update = props.update || ((_oldValue: number, newValue: number, _delta: number) => newValue);
 const up = () => {
     const newValue = update(value.value, value.value + 1, 1);
     value.value = Math.min(props.maximum || newValue, newValue);
 };
 const down = () => {
     const newValue = update(value.value, value.value - 1, -1);
     value.value = Math.max(props.minimum || newValue, newValue);
 };
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
