<script setup lang="ts">
 import { ref, onMounted, nextTick } from 'vue';
 import type { Ref } from 'vue';
 import { loadDataDir, DataDir } from '../data-loader';
 import MechabellumTurn from '../components/MechabellumTurn.vue';
 import { TurnCoordinator, MechabellumTurnInterface } from '../turn-coordinator';
 import { useRoute } from 'vue-router';
 import { decode, sleep } from '../utils';
 import { CURRENT_VERSION } from '../consts';

 const route = useRoute();

 let turns = ref([]);
 const dataDir = await loadDataDir(CURRENT_VERSION);
 const buildToLoad = (() => {
     const build = route.query.build;
     if (!build) return;
     const value = JSON.parse(decode(route.query.build));
     console.log("loading", JSON.stringify(value, null, 4));
     return value;
 })();

 let exportData = ref("");
 const updateExportString = (newExportData: string) => {
     exportData.value = `${location.protocol}//${location.host}${route.path}?build=${newExportData}`

 };
 const loadTurn = (turn: MechabellumTurnInterface): void => {
     if (!buildToLoad) return;
     const loadingTurn = buildToLoad.turns[turn.turnNumber - 1];
     if (!loadingTurn) return;

     console.log(turn.turnNumber, loadingTurn);

     turn.reinforcement.value = loadingTurn.reinforcement;
     Object.entries(turn.towerButtons.value).forEach(([key, value]) => {
	 turn.towerButtons.value[key] = loadingTurn.towerButtons.includes(key);
     });
     turn.unitUnlock.value = loadingTurn.unitUnlock;
     turn.mechSlots.value = loadingTurn.mechSlots;
     turn.recoveredUnit.value = loadingTurn.recoveredUnit;
     turn.levelUps.value = new Set<number>(loadingTurn.levelUps);
     Object.entries(loadingTurn.devices).forEach(([key, value]) => turn.devices[key].value = value);
     coordinator.setTechs(buildToLoad.techs);
     if (loadingTurn.startingUnits !== undefined) {
	 turn.startingUnits.value = loadingTurn.startingUnits;
     }

 };


 let showExport = ref(false);
 const toggleExport = () => {
     showExport.value = !showExport.value;
 };


 function add() {
     turns.value.push(0);
 }

 onMounted(async () => {
     if (!buildToLoad) return;
     for (const _ of buildToLoad.turns) {
	 add();
	 // hack
	 // The steps each load async and can possibly resolve out of order.
	 // The order they resolve in defines which turn they think they are.
	 // sleeping here gives plenty of time for them to resolve.
	 // Should find a real solution to enforce ordering.
	 await sleep(30);
     }
 });

 const coordinator = new TurnCoordinator({dataDir: dataDir, updateExportString: updateExportString, loadTurn: loadTurn});
</script>

<template>
    <div class="planner-container">
	<div class="copy">
	    <div @click="toggleExport" class="clickable">
		<span v-if="showExport">&#x25BC;</span>
		<span v-if="!showExport">&#x25B6;</span>
		Export
	    </div>
	    <div v-if="showExport" class="show-export">
		<div>Copy the below for a direct link to this build. I know its super ugly. For the time being if you want a shorter link for now you will need to use a link shortener service.</div>
		<div>{{ exportData }}</div>
	    </div>
	</div>

	<div class="planner-root">
	    <MechabellumTurn v-for="[i, t] in turns.entries()" :turn-number="i + 1" :coordinator="coordinator">
	    </MechabellumTurn>
	    <div class="clickable button" @click="add">Add Turn</div>
	</div>
    </div>
</template>

<style scoped>
 .planner-container {
     display: grid;
     grid-template-columns: 1fr;
     grid-row-gap: 2em;
 }
 .planner-root {
     display: grid;
     grid-template-rows: 1fr;
     grid-template-columns: 1fr;
     grid-row-gap: 2em;
 }

 .copy {
     display: grid;
     grid-template-rows: auto auto 1fr;
     grid-template-columns: 1fr;
     grid-row-gap: 0.5em;
     background-color: var(--color-background-soft);
     word-break: break-all;
     word-wrap: break-word;
     padding: 1em;
 }

 .show-export {
     border-top: 1px solid var(--color-border);
     padding: 1em;
     display: grid;
     grid-auto-rows: auto;
     grid-row-gap: 1em;
 }

</style>
