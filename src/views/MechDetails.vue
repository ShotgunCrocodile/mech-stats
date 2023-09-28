<script setup lang="ts">
 import { ref } from 'vue';
 import { useRouter } from 'vue-router';
 import { CURRENT_VERSION } from '../consts';
 import { loadDataDir, DataDir } from '../data-loader';
 import { modifyMech, describeMod } from '../mech-updater';
 import { ModData } from '../data-types';
 import { calculateMechDPS, calculateSurvival } from '../mech-predicates';

 const props = defineProps<{
     mechName: string,
 }>();

 const route = useRouter().currentRoute.value;
 const mechName = props.mechName;;

 const dataDir: DataDir = await loadDataDir(CURRENT_VERSION);
 const levelModTemplate = dataDir.modData['LevelTemplate'];
 let mechLevel = 1;

 const baseMechData = dataDir.mechData[mechName]
 const mechData = ref(dataDir.mechData[mechName]);
 const mods: ModData[] = dataDir.modsForTags(dataDir.mechTags(mechName));

 let activeModifiers = ref([]);
 let dps = calculateMechDPS(mechData.value);
 let survivals = calculateSurvival(mechData.value);

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

 function update() {
     updateMechData();
     updateLevelMod();
     dps = calculateMechDPS(mechData.value);
     survivals = calculateSurvival(mechData.value);
 }

 function updateMechData() {
     const modifiers: ModData[] = Object.values(mods)
			     .filter((mod: any) => activeModifiers.value.includes(mod.name));
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

	<div/>

	<div>
	    <v-select
		v-model="activeModifiers"
		:options="mods.map((m) => m.name).filter((mod) => !activeModifiers.includes(mod))"
		:closeOnSelect="false"
		@option:selected="update"
		@option:deselected="update"
		multiple
	    />
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
     grid-template-columns: 1fr 1fr 1fr;
     grid-template-rows: auto 1fr;
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
