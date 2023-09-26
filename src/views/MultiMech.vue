<script setup lang="ts">
 import { ref } from 'vue';
 import { loadDataDir } from '../data-loader';
 import MechDetails from './MechDetails.vue';

 const dataDir = await loadDataDir("0.7.24");

 const selectedMechName = ref('ARCLIGHT');
 const mechs = ref([]);

 function add() {
     mechs.value.push(selectedMechName.value)
 }

 function remove(index: number) {
     mechs.value.splice(index, 1);
 }
</script>

<template>
    <div class="multi-mech-container">
	<div class="details-list" v-for="(mech, index) in mechs">
	    <MechDetails :mech-name="mech" />
	    <div class="remove-button" @click="remove(index)">Delete</div>
	</div>
	<div class="controls">
	    <v-select
		:options="dataDir.mechNames().sort()"
		v-model="selectedMechName"
	    />
	    <!-- <select v-model="selectedMechName">
		 <option v-for="name in dataDir.mechNames().sort()">
		 {{ name }}
		 </option>
		 </select> -->
	    <div class="plus-button" @click="add">+</div>
	</div>
    </div>
</template>


<style scoped>
 .controls {
     display: grid;
     grid-template-columns: 3fr 1fr;
 }
 .multi-mech-container {
     display: grid;
     grid-template-columns: 1fr;
     grid-template-rows: 1fr;
 }

 .details-list {
     display: grid;
     grid-template-columns: 1fr;
     grid-template-rows: 1fr;
     padding-left: 20px;
     border-left: 1px solid var(--color-border);
 }

 .details-list:nth-child(2n-1) {
     background-color: var(--color-background-soft);
 }

 .details-list:nth-child(2n) {
     background-color: var(--color-background-mute);
 }

 .plus-button {
     cursor: pointer;
     user-select: none;
     text-align: center;
     color: var(--color-text-accent);
     font-size: 200%;

 }

 .plus-button:hover {
     background-color: var(--color-background-soft);
 }

 .plus-button:active {
     background-color: var(--color-background-mute);
 }

 .remove-button {
     cursor: pointer;
     user-select: none;
     text-align: center;
     color: var(--color-text-negative);
     font-size: 200%;
 }
 .remove-button:hover {
     background-color: var(--color-background-soft);
 }

 .remove-button:active {
     background-color: var(--color-background-mute);
 }

 >>> {
     --vs-controls-color: var(--color-text);
     --vs-border-color: var(--color-border);

     --vs-dropdown-bg: var(--color-background-soft);
     --vs-dropdown-color: var(--color-text);
     --vs-dropdown-option-color: var(--color-text);

     --vs-selected-bg: var(--color-background-mute);
     --vs-selected-color: var(--color-text);

     --vs-search-input-color: var(--color-text);

     --vs-dropdown-option--active-bg: var(--color-background-mute);
     --vs-dropdown-option--active-color: var(--color-heading);

     --vs-dropdown-min-width: 250px;
 }

</style>
