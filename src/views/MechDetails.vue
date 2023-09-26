<script setup lang="ts">
 import { ref } from 'vue';
 import { useRouter } from 'vue-router';
 import { loadDataDir, DataDir } from '../data-loader';
 import { modifyMech, describeMod } from '../mech-updater';
 import { ModData } from '../data-types';
 import { calculateMechDPS, calculateSurvival } from '../mech-predicates';

 const props = defineProps<{
     mechName: string,
 }>();

 const route = useRouter().currentRoute.value;
 const mechName = props.mechName;;


 const dataDir: DataDir = await loadDataDir("0.7.24");
 const levelModTemplate = dataDir.modData['LevelTemplate'];
 let mechLevel = 1;

 const baseMechData = dataDir.mechData[mechName]
 const mechData = ref(dataDir.mechData[mechName]);
 const mods: ModData[] = dataDir.modsForTags(dataDir.mechTags(mechName));

 let activeModifiers = new Set<string>();
 const dps = calculateMechDPS(mechData.value);
const survivals = calculateSurvival(mechData.value);

 function mounted() {
     update();
 }

 function clamp(value: number, min: number, max: number): number {
     return Math.min(Math.max(value, min), max);
 }


 function click(arg: any) {
     arg.target.classList.toggle("pressed");
     updateLevelMod();
     toggleModifier(arg.target.innerText);
 }


 function level(change: number){
     mechLevel = clamp(mechLevel + change, 1, 9);
     update();
 }


 function toggleModifier(name: string): void {
     if (activeModifiers.has(name)) {
	 activeModifiers.delete(name);
     } else {
	 activeModifiers.add(name);
     }
     updateMechData();
 }


 function update() {
     updateMechData();
     updateLevelMod();
 }


 function updateMechData() {
     const modifiers: ModData[] = Object.values(mods)
			     .filter((mod: any) => activeModifiers.has(mod.name));
     modifiers.push(levelModTemplate);
     mechData.value = modifyMech(baseMechData, modifiers);
 }


 function updateLevelMod() {
     levelModTemplate.effects = [
	 {
	     "property": "level",
	     "operation": "set",
	     "value": mechLevel.toString(),
	 },
	 {
	     "property": "atk",
	     "operation": "mul",
	     "value": (mechLevel - 1).toString(),
	 },
	 {
	     "property": "hp",
	     "operation": "mul",
	     "value": (mechLevel - 1).toString(),
	 }
     ];
 }


</script>
<template>
    <div class="container">
	<h1 class="mech-name underlined">{{ mechName }}</h1>
	<div class="level-selector">
	    <span class="clickable" @click="level(-1)">&#8592;</span>
	    Level: {{ mechData.level }}
	    <span class="clickable" @click="level(1)">&#8594;</span>
	</div>
	<div></div>

	<div class="modifier-list">
	    <div :title="describeMod(mod)" class="button clickable" v-for="mod in mods" @click="click" >{{ mod.name }}</div>
	</div>
	<div class="stat-block-group">
	    <div class="stat-block">
		<div>Cost</div>
		<div>{{ mechData.cost }}</div>

		<div>Upgrade</div>
		<div>{{ mechData.upgrade }}</div>

		<div>Unlock</div>
		<div>{{ mechData.unlock }}</div>

		<div>Upkeep</div>
		<div>{{ mechData.upkeep }}</div>
	    </div>
	    <div class="stat-block">
		<div>Units in pack</div>
		<div>{{ mechData.units }}</div>

		<div>Base XP</div>
		<div>{{ mechData.xp }}</div>

		<div>Location</div>
		<div>{{ mechData.location }}</div>
	    </div>
	    <div class="stat-block">
		<div>Health</div>
		<div>{{ mechData.hp }}</div>

		<div>Regeneration</div>
		<div>{{ Math.floor(mechData.regeneration * mechData.hp) + " hp/s" }}</div>

		<div>Damage Reduction</div>
		<div>{{ mechData.reduction }}</div>

		<div>Speed</div>
		<div>{{ mechData.speed + "m/s" }}</div>
	    </div>
	    <div class="stat-block">
		<div>Attack</div>
		<div>{{ mechData.atk }}</div>

		<div>Delay</div>
		<div>{{ mechData.interval + "s" }}</div>

		<div>Range</div>
		<div>{{ mechData.range > 0 ? mechData.range + "m" : "Melee" }}</div>

		<div>Targets</div>
		<div>{{ mechData.targets }}</div>

		<div>Projectiles</div>
		<div>{{ mechData.projectiles }}</div>

		<div>Splash</div>
		<div>{{ mechData.splash + "m" }}</div>
	    </div>
	</div>
	<div>
	    <div class="stat-block-group">
		<div class="stat-block">
		    <div>Damage:</div> <div></div>
		    <div v-for="v in Array.from(dps.entries()).flat()">
			{{ v }}
		    </div>
		</div>


		<div class="stat-block">
		    <div>Survival:</div> <div></div>
		    <div v-for="v in Array.from(survivals.entries()).flat()">
			{{ v }}
		    </div>
		</div>
	    </div>
	</div>
    </div>
</template>


<style scoped>
 .container {
     display: grid;
     grid-template-columns: minmax(1em, auto) minmax(1em, auto) minmax(1em, auto);
     grid-template-rows: minmax(1em, auto) minmax(auto, 500px);
     grid-column-gap: 4em;
 }

 .underlined {
     border-bottom: 1px solid var(--color-border);
 }

 .stat-block-group {
     display: grid;
     grid-template-columns: 1fr;
     grid-row-gap: 0.5em;
 }
 .stat-block {
     display: grid;
     grid-template-columns: 1fr 1fr;
     grid-column-gap: 1em;
     border-bottom: 1px solid var(--color-border);
 }
 .stat-block div:nth-child(2n - 1) {
     font-weight: bold;
 }

 .modifier-list {
     display: grid;
     grid-template-columns: auto;
     overflow-y: auto;
     justify-content: left;
 }
 .modifier-list .button {
     background-color: var(--color-background-soft);
     padding-left: 20px;
 }
 .modifier-list .button.pressed {
     background-color: var(--color-background-mute);
     color: var(--color-text-accent);
 }

 .clickable {
     cursor: pointer;
     user-select: none;
 }

 .mech-name {
     text-align: center;
     color: var(--color-text-accent);
 }

 .level-selector {
     text-align: center;
 }

</style>
