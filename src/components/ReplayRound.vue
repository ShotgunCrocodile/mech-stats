<script setup lang="ts">
 import type { MechData } from '../data-types';
 import { PlayerRoundRecord, PlayerRecord, UnitStore, UnitData, UnitSource } from '../replay';
 import { DataDir } from '../data-loader';

 import Map from '../components/Map.vue';
 import PlayerRoundInfo from '../components/PlayerRoundInfo.vue';

 const props = defineProps<{
     blue: PlayerRecord;
     red: PlayerRecord;
     roundNumber: number;
     dataDir: DataDir,
 }>();

 enum Team {
     BLUE = 1,
     RED,
 };

 const rotateFlankUnits = (team: Team, unit: UnitData): UnitData => {
     if (unit.source === UnitSource.NewUnitData) {
	 console.log("TEST", unit.id)
  	 return unit;
     }
     if (team === Team.BLUE && unit.position.y > 0) {
 	 unit.rotated = !unit.rotated;
     } else if (team == Team.RED && unit.position.y < 0) {
 	 unit.rotated = !unit.rotated;
     }
     return unit;
 };


 const loadUnitFunction = (team: Team, style) => {
     return (unit) => {
	 console.log(unit, unit.id);
	 const mech = props.dataDir.objectForGameId(unit.id);
	 console.log(mech);

	 let width = mech.dimension.width;
	 let height = mech.dimension.height;
	 unit = rotateFlankUnits(team, unit);
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
	 .map(loadUnitFunction(Team.BLUE, "blue"));

     const redStore = new UnitStore({units: props
	 .red
	 .roundRecords[props.roundNumber]
	 .playerData
	 .units});
     console.log("RED ACTIONS: ", props.red.roundRecords[props.roundNumber].actions);
     redStore.applyActions(props.red.roundRecords[props.roundNumber].actions);
     const redUnits = redStore
	 .units
	 .map(loadUnitFunction(Team.RED, "red"));

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
