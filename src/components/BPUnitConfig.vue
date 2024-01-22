<script setup lang="ts" >
 import { ref, computed, watch } from 'vue';
 import type { ModData, MechData } from '../data-types';
 import { DataDir } from '../data-loader';

 const props = defineProps<{
     dataDir: DataDir;
     mechName: string;
 }>();
 const emit = defineEmits(['change']);

 const affectsProperty = (property: string, mod: ModData): boolean => {
     return mod.effects.filter((effect) => effect.property === property).length > 0;
 };

 const mech = props.dataDir.mechForName(props.mechName);
 const mods = props
     .dataDir
     .modsForTags(props.dataDir.mechTags(props.mechName))
     .filter((mod) => affectsProperty("atk", mod) || affectsProperty("hp", mod));

 const towers = mods.filter((mod) => mod.tags.includes("Tower"));
 const techs = mods.filter((mod) => mod.tags.includes("Tech"));
 const cards = mods.filter((mod) =>
     mod.tags.includes("Reinforcement") && !mod.tags.includes("Item"));
 const items = mods.filter((mod) => mod.tags.includes("Item"));

 const config = ref({
     "name": props.mechName,
     "attacker": false,
     "defender": false,
     "towers": Object.fromEntries(towers.map((mod) => [mod.name, {...mod, active: false}])),
     "techs": Object.fromEntries(techs.map((mod) => [mod.name, {...mod, active: false}])),
     "cards": Object.fromEntries(cards.map((mod) => [mod.name, {...mod, active: false}])),
     "items": Object.fromEntries(items.map((mod) => [mod.name, {...mod, active: false}])),
 });
 const allTowers = computed(() => {
     return !Object.values(config.value.towers).map((mod) => mod.active).includes(false);
 });
 const allTechs = computed(() => {
     return !Object.values(config.value.techs).map((mod) => mod.active).includes(false);
 });
 const allCards = computed(() => {
     return !Object.values(config.value.cards).map((mod) => mod.active).includes(false);
 });
 const allItems = computed(() => {
     return !Object.values(config.value.items).map((mod) => mod.active).includes(false);
 });
 console.log(config);

 const updateAll = (event, name) => {
     const newValue = !event.target._modelValue;
     const newObj = Object
	 .fromEntries(Object
	     .entries(config.value[name])
	     .map(([name, value]) => {return [name, {...value, active: newValue}]}));
     config.value[name] = newObj;
 };

 watch(config, () => {
     emit('change', config);
 }, {deep: true});
emit('change', config);
</script>

<template>
    <div class="unit-container">
	<div class="row-1">
	    <h2 style="color: var(--color-text-accent);">
		{{ props.mechName }}
	    </h2>
	    <div class="pair">
		<div>
		    <input type="checkbox" v-model="config.defender"/>
		</div>
		<div>Defender</div>
	    </div>
	    <div class="pair">
		<div>
		    <input type="checkbox" v-model="config.attacker" />
		</div>
		<div>Attacker</div>
	    </div>
	</div>
	<div>
	    <h3>Towers</h3>
	    <div class="pair bottom-line">
		<input type="checkbox" v-model="allTowers" @click="updateAll($event, 'towers')"/>
		<div>Both</div>
	    </div>
	    <div class="pair" v-for="mod in towers" v-bind:key="mod.name">
		<div>
		    <input type="checkbox" v-model="config.towers[mod.name].active" />
		</div>
		<div>{{mod.name}}</div>
	    </div>
	</div>
	<div>
	    <h3>Techs</h3>
	    <div class="pair bottom-line">
		<input type="checkbox" v-model="allTechs" @click="updateAll($event, 'techs')" />
		<div>All</div>
	    </div>
	    <div class="pair" v-for="mod in techs" v-bind:key="mod.name">
		<div>
		    <input type="checkbox" v-model="config.techs[mod.name].active" />
		</div>
		<div>{{mod.name}}</div>
	    </div>
	</div>
	<div>
	    <h3>Cards</h3>
	    <div class="pair bottom-line">
		<input type="checkbox" v-model="allCards" @click="updateAll($event, 'cards')" />
		<div>All</div>
	    </div>
	    <div class="pair" v-for="mod in cards" v-bind:key="mod.name">
		<div>
		    <input type="checkbox" v-model="config.cards[mod.name].active" />
		</div>
		<div>{{mod.name}}</div>
	    </div>
	</div>
	<div>
	    <h3>Items</h3>
	    <div class="pair bottom-line">
		<input type="checkbox" v-model="allItems" @click="updateAll($event, 'items')" />
		<div>All</div>
	    </div>
	    <div class="pair" v-for="mod in items" v-bind:key="mod.name">
		<div>
		    <input type="checkbox" v-model="config.items[mod.name].active" />
		</div>
		<div>{{mod.name}}</div>
	    </div>
	</div>
    </div>
</template>

<style scoped>
 .bottom-line {
    border-bottom: 1px solid var(--color-border);
 }

.unit-container {
     padding: 0.5em;
     display: grid;
     grid-template-columns: auto auto auto auto auto;

     border: 1px solid var(--color-border);
     grid-column-gap: 2em;
 }

 .row-1 {
     display: grid;
     grid-template-rows: min-content min-content min-content;
 }

 .pair {
     display: grid;
     grid-template-columns: min-content auto;
     column-gap: 1em;
 }

 .pair div {
     white-space: nowrap;
 }
</style>
