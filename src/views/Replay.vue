<script setup lang="ts">
 import { ref, onMounted } from 'vue';
 import { Replay } from '../replay';
 import { REPLAY, CURRENT_VERSION } from '../consts';
 import { DataDir, loadDataDir } from '../data-loader';

 import NumberInput from '../components/NumberInput.vue';
 import ReplayPlayer from '../components/ReplayPlayer.vue';
 import ReplayRound from '../components/ReplayRound.vue';

 const replay = ref(Replay.fromXML(REPLAY));
 const round = ref(1);
 const stupid = {
     "round": round,
 }
 const dataDir: DataDir = await loadDataDir(CURRENT_VERSION);

 const changeRound = (oldValue, newValue, delta): number => {
     return Math.max(
	 1,
	 Math.min(
	     replay.value.players[0].roundRecords.length - 1,
	     newValue)
     );
 };
</script>

<template>
    <!-- <input type="file" id="file-selector" accept=".grbr" @change="change"> -->
    <div class="replay-container">
	<div class="replay-header">
	    <div style="text-align: right">
		Round
	    </div>
	    <NumberInput
		:value="stupid['round']"
		:update="changeRound"
	    />
	</div>
	<template v-for="(roundRecord, index) in replay.players[0].roundRecords">
	    <ReplayRound
		v-bind:key="index"
		v-if="index === round"
		:blue="replay.players[0]"
		:red="replay.players[1]"
		:roundNumber="index"
		:dataDir="dataDir"
	    />
	</template>
    </div>
</template>


<style scoped>
 .replay-container {
     display: grid;
     grid-template-rows: min-content auto;
     grid-row-gap: 1em;
     border-bottom: 1px solid var(--color-border);
     justify-content: center;
 }

 .replay-header {
     display: grid;
     grid-template-columns: 1fr 1fr;
     grid-column-gap: 1em;
     align-items: center;
 }
</style>
