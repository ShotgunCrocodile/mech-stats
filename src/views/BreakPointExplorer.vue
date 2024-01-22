<script setup lang="ts">
 import type { ModData, MechData } from '../data-types';
 import { ref, computed, toRaw } from 'vue';
 import { loadDataDir, DataDir } from '../data-loader';
 import { CURRENT_VERSION } from '../consts';
 import { modifyMech, describeMod } from '../mech-updater';
 import {isDefined } from '../utils';

 import BPUnitConfig from '../components/BPUnitConfig.vue';

 const itemsAllowed = ref(false);
 const techAllowed = ref(false);
 const reinforcementAllowed = ref(false);

 class UnitConfig {
     name: string;
     mods: ModData[];
     attacker: boolean;
     defender: boolean;

     constructor(params: {name: string, mods: string[], attacker: boolean, defender: boolean}) {
	 this.name = params.name;
	 this.mods = params.mods;
	 this.attacker = params.attacker;
	 this.defender = params.defender;
     }

     static fromBPUnitConfig(unitConfig) {
	 const allMods = Object
	     .entries(unitConfig.towers)
	     .concat(Object.entries(unitConfig.techs))
	     .concat(Object.entries(unitConfig.cards))
	     .concat(Object.entries(unitConfig.items))
	     .filter(([_, mod]) => mod.active === true)
	     .map(([_, mod]) => toRaw(mod));
	 return new UnitConfig({
	     'name': unitConfig.name,
	     'attacker': unitConfig.attacker,
	     'defender': unitConfig.defender,
	     'mods': allMods,
	 });
     }
 }


 class Config {

     unitConfigs: {[key: string]: UnitConfig};
     unitNames: string[];

     constructor() {
	 this.unitConfigs = {};
	 this.unitNames = [];
     }

     attackers(): UnitConfig[] {
	 return Object
	     .values(this.unitConfigs)
	     .filter((config) => config.attacker)
     }

     defenders(): UnitConfig[] {
	 return Object
	     .values(this.unitConfigs)
	     .filter((config) => config.defender)
     }
 }

 class ModCombo {
     name: string;
     mods: string[];
     value: number;

     constructor(params: {name: string, mods: string[], value: number}) {
	 this.name = params.name;
	 this.mods = params.mods;
	 this.value = params.value;
     }

     static sort(a: ModCombo, b: ModCombo): number {
	 return a.value - b.value;
     }
 }


 const affectsProperty = (property: string, mod: ModData): boolean => {
     return mod.effects.filter((effect) => effect.property === property).length > 0;
 };


 function* powerSet(array: any[], offset: number = 0) {
     while (offset < array.length) {
	 let first = array[offset++];
	 for (let subset of powerSet(array, offset)) {
	     subset.push(first);
	     yield subset;
	 }
     }
     yield [];
 }


 const resolve = (mech: MechData, mods: ModData[], property: string): ModCombo => {
     // Need to fix that all items are reinforcements.
     const limits = {
	 // "Item": itemsAllowed.value ? 1 : 0,
	 // 	 "Tech": techAllowed.value ? 4 : 0,
	 // "Reinforcement": reinforcementAllowed.value ? 100 : 0,
     }
     const tags = mods.reduce((acc, mod: ModData) => {
	 mod.tags.forEach((tag) => acc[tag] = acc[tag] ? acc[tag] + 1 : 1);
	 return acc;
     }, {});

     for (const [tag, limit] of Object.entries(limits)) {
	 if (tags[tag] > limit) return undefined
     }
     return new ModCombo({
	 name: mech.name,
	 mods: mods.map((mod) => mod.name),
	 value: modifyMech(mech, mods, 1)[property],
     });
 }


 const permutationsForMech = (mechName: string, mods: ModData[], property: string): ModCombo[] => {
     console.log(mods);
     const mech = dataDir.mechForName(mechName);
     // Filter out mods that do not affect the property we are interested in.
     mods = mods
	 .filter((mod) => mod
	     .effects
	     .map((effect) => effect.property)
	     .includes(property))

     const modCombos = Array
	 .from(powerSet(mods))
	 .map((mods: ModData[]) => resolve(mech, mods, property))
	 .filter(isDefined)
	 .sort(ModCombo.sort);

     return modCombos
 }


 const findBreakpoints = (atks: ModCombo[], hps: ModCombo[]) => {
     const matrix: number[][] =[...Array(atks.length)].map(e => Array(hps.length));
     atks.forEach((atk: ModCombo, i: number) => {
	 hps.forEach((hp: ModCombo, j: number) => {
	     matrix[i][j] = Math.ceil(hp.value / atk.value);
	 })
     })
     return matrix;
 };


 class TableCell {

     value: number | string
     tooltip: string

     constructor(params: {value: number | string, tooltip?: string}) {
	 this.value = params.value
	 this.tooltip = params.tooltip ? params.tooltip : "";
     }
 }
 const rootConfig = ref(new Config());

 const updateMechs = () => {
     console.log(rootConfig.value.unitNames);
 };


 const configUpdate = (unitConfig) => {
     rootConfig.value.unitConfigs[unitConfig.value.name] = UnitConfig.fromBPUnitConfig(unitConfig.value);
 }


 const dataDir: DataDir = await loadDataDir(CURRENT_VERSION);


 const attackers = computed(() => {
     return rootConfig.value.attackers();
 })


 const atkValues = computed(() => {
     return attackers
	 .value
	 .map((attacker) => permutationsForMech(attacker.name, attacker.mods, 'atk'))
	 .flat();
 })


 const defenders = computed(() => {
     return rootConfig.value.defenders();
 });


 const defValues = computed(() => {
     return defenders
	 .value
	 .map((defender) => permutationsForMech(defender.name, defender.mods, 'hp'))
	 .flat();
 });


 const breakpoints = computed(() => {
     return findBreakpoints(atkValues.value, defValues.value);
 });


 const displayValue = (mc: ModCombo): string => {
     const shorthand = mc
	 .mods
	 .map((mod) => mod.split(' ').map((part) => part[0]).join(''))
     .join('+')
     return mc.value + ' ' + shorthand
 };


 const tooltipFromModCombo = (mc: ModCombo): string => {
     return mc.name + '\n' + mc.mods.join('\n');
 }


 const atkColumn = computed(() => {
     return atkValues
	 .value
	 .map((mc: ModCombo) => new TableCell({value: displayValue(mc), tooltip: tooltipFromModCombo(mc)}));
 });


 const tableCells = computed(() => {
     return []
 	 .concat(defValues.value.map((hp: ModCombo) => new TableCell({value: displayValue(hp), tooltip: tooltipFromModCombo(hp)})))
 	 .concat(atkValues.value.map((atk, row) => {
 	     return [

 	     ].concat(breakpoints.value[row].map((bp) => new TableCell({value: bp})))
 	 }))
 	 .flat();
 });
</script>

<template>
    <div class="controls">
	<div class="control-column">
	    <div class="pair">
		<div>Units:</div>
		<v-select
		    v-model="rootConfig.unitNames"
		    :options="dataDir.mechNames().sort()"
		    :closeOnSelect="false"
		    @option:selected="updateMechs"
		    @option:deselected="updateMechs"
		    multiple
		/>
	    </div>

	    <div v-for="unit in rootConfig.unitNames">
		<BPUnitConfig
		    :dataDir="dataDir"
		    :mechName="unit"
		    @change="configUpdate"
		/>
	    </div>

	</div>

    </div>
    <div class="table-pair">
	<div class="table">
	    <div></div>
	<div v-for="cell in atkColumn" :title="cell.tooltip">
	    {{cell.value}}
	</div>
    </div>
    <div class="table scrollable" :style="`grid-template-columns: repeat(${defValues.length}, 1fr);`">
	<div v-for="cell in tableCells" :title="cell.tooltip">
	    {{cell.value}}
	</div>
    </div>
    </div>
</template>

<style scoped>
 .pair {
     display: grid;
     grid-template-columns: min-content auto;
     grid-column-gap: 1em;
 }
 .table-pair {
     display: grid;
     grid-template-columns: min-content auto;
     grid-column-gap: 1em;
     overflow: hidden;
     white-space: nowrap;
 }
 .scrollable {
     overflow-x: scroll;
 }
 .controls {
     display: grid;
     grid-template-columns: 1fr;
     border-bottom: 1px solid var(--color-border);
     padding: 1em;
 }

 .control-column {
     display: grid;
     grid-auto-rows: min-content;
     grid-row-gap: 1em;
     margin-left: 1em;
 }

 .table {
     display: grid;
     grid-template-rows: 1fr;
     row-gap: 1em;
     column-gap: 1em;
 }

 .cell {
     display: grid;
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
