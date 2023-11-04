<script setup lang="ts">
 import type { MechData } from '../data-types';
 import { PlayerRoundRecord, PlayerRecord, UnitStore } from '../replay';
 import { DataDir } from '../data-loader';

 import Map from '../components/Map.vue';
 import PlayerRoundInfo from '../components/PlayerRoundInfo.vue';

 const props = defineProps<{
     blue: PlayerRecord;
     red: PlayerRecord;
     roundNumber: number;
     dataDir: DataDir,
 }>();

 const loadUnitFunction = (style) => {
     return (unit) => {
	 console.log(unit, unit.id);
	 const mech = props.dataDir.objectForGameId(unit.id);
	 console.log(mech);

	 let width = mech.dimension.width;
	 let height = mech.dimension.height;
	 if (unit.rotated) {
	     width = mech.dimension.height;
	     height = mech.dimension.width;
	 }
	 return {
	     movable: false,
	     x: unit.position.x,
	     y: unit.position.y,
	     width: width,
	     height: height,
	     name: mech.name,
	     style: style,
	     index: unit.index,
	 }
     };
 }

 const objectsForRound = () => {
     console.log(props);
     const blueStore = new UnitStore({units: props
	 .blue
	 .roundRecords[props.roundNumber]
	 .playerData
	 .units});
     blueStore.applyActions(props.blue.roundRecords[props.roundNumber].actions);
     const blueUnits = blueStore
	 .units
	 .map(loadUnitFunction("green"));

     const redStore = new UnitStore({units: props
	 .red
	 .roundRecords[props.roundNumber]
	 .playerData
	 .units});
     redStore.applyActions(props.red.roundRecords[props.roundNumber].actions);
     const redUnits = redStore
	 .units
	 .map(loadUnitFunction("red"));

     const units = blueUnits.concat(redUnits);
     console.log("units", units);
     return {
	 "objects": units,
     };
 };
</script>

<template>
    <div class="round-container">
	<div>
	    <Map :editor="false" :objects='objectsForRound()' />
	</div>
	<div class="player-info-container">
	    <div>
		<PlayerRoundInfo
		    :player="props.red"
		    :roundNumber="props.roundNumber"
		    :dataDir="props.dataDir" />
	    </div>
	    <div>
		<PlayerRoundInfo
		    :player="props.blue"
		    :roundNumber="props.roundNumber"
		    :dataDir="props.dataDir" />
	    </div>
	</div>
    </div>
</template>

<style scoped>
 .round-container {
     display: grid;
     grid-template-columns: auto auto;

     border: 1px solid var(--color-border);
     background: var(--color-background-soft);
 }

 .player-info-container {
     display: grid;
     grid-template-rows: auto auto;
 }
</style>
