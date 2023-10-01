<script setup lang="ts">
 import { PlayerRoundRecord } from '../replay';
 import { DataDir } from '../data-loader';

 import Map from '../components/Map.vue';

 const props = defineProps<{
     blue: PlayerRoundRecord;
     red: PlayerRoundRecord;
     dataDir: DataDir,
 }>();
</script>

<template>
    <div class="round-container">
	<div>
	    <Map />
	</div>
	{{ red.round }}
	<!-- <div v-for="officer in round.playerData.officers">
	     {{dataDir.objectForGameId(officer)?.name || officer}}
	     </div> -->
    </div>
</template>

<style scoped>
 .round-container {
     display: grid;
     grid-template-columns: auto auto;

     border: 1px solid var(--color-border);
     background: var(--color-background-soft);
 }

</style>
