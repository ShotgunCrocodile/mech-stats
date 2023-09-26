<script setup lang="ts">
 import { ref } from 'vue';
 import type { Ref } from 'vue';
 import { Unit, TechSnapshot } from '../turn-coordinator';
 import IconRecycle from './icons/IconRecycle.vue';
 import IconUpgrade from './icons/IconUpgrade.vue';

 const props = defineProps<{
     unit: Unit,
     recoverUnlocked: boolean,
     recoveredUnit: Ref<string>,
     setRecovered: (ident: string) => void,
     levelUps: Ref<Set<number>>;
     levelUp: (ident: string) => void,
     techs: TechSnapshot,
 }>();

 const techs = props.techs[props.unit.baseModel.name];
</script>


<template>
    <div class="unit-container">
	<div>
	    <div class="icon-button clickable" @click="props.setRecovered(props.unit.ident)" v-if="recoverUnlocked"
		 :title="`Recover level ${props.unit.level} ${props.unit.baseModel.name}`"
		 :class="{'icon-button-selected': props.unit.ident === props.recoveredUnit}">
		<IconRecycle />
	    </div>
	</div>

	<div class="icon-button clickable" @click="props.levelUp(props.unit.ident)"
	     title="Level up"
	     :class="{'icon-button-selected': props.levelUps.has(props.unit.ident)}">
	    <IconUpgrade />
	</div>

	<div>
	    {{ props.unit.ident }}
	</div>

	<div>
	    {{ props.unit.baseModel.name }}
	</div>

	<div>
	    lvl {{ props.unit.level }}
	</div>
    </div>
</template>


<style scoped>
 .unit-container {
     display: grid;
     grid-template-columns: 30px 30px auto 1fr 1fr;
     grid-column-gap: 3px;
 }

 .tech-container {
     display: grid;
     grid-template-columns: auto auto auto 1fr;
 }

 .icon-button {
     width: 28px;
     height: 28px;
 }

 .icon-button::v-deep(.bgPath) {
     fill: var(--color-background-soft);
 }

 .icon-button::v-deep(.bgPath) {
     fill: var(--color-background);
 }

 .icon-button::v-deep(.fgPath) {
     fill: var(--color-text);
 }
 .icon-button-selected::v-deep(.fgPath) {
     fill: var(--color-text-accent);
 }

</style>
