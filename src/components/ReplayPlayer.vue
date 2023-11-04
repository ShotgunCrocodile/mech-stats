<script setup lang="ts">
 import { PlayerRecord } from '../replay';
 import { DataDir } from '../data-loader';
 import ReplayRound from './ReplayRound.vue';

 const props = defineProps<{
     player: PlayerRecord;
     dataDir: DataDir;
 }>();
</script>

<template>
    <div>
	{{ player.name }}
    </div>
    <div class="rounds-container">
	<div v-for="round in player.roundRecords.slice(1)">
	    <ReplayRound
		:player="props.player"
		:round="round"
		:dataDir="dataDir"
	    />
	</div>
    </div>
</template>

<style scoped>
 .rounds-container {
     display: grid;
     grid-auto-rows: auto;
     grid-row-gap: 1em;
 }
</style>
