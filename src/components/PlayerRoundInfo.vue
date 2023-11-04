<script setup lang="ts">
 import { PlayerRecord, PlayerRoundRecord } from '../replay';
 import { DataDir } from '../data-loader';


 const props = defineProps<{
     player: PlayerRecord;
     roundNumber: number;
     dataDir: DataDir;
 }>();

 const playerRoundRecord = props.player.roundRecords[props.roundNumber];

</script>

<template>
    <div>
	{{props.player.name}} {{props.roundNumber}}
	<div v-for="officer in playerRoundRecord.playerData.officers">
	    {{ props.dataDir.objectForGameId(officer)?.name || officer }}
	</div>
    </div>
</template>

<style scoped>

</style>
