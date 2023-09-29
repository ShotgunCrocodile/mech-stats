<script setup lang="ts">
import { CURRENT_VERSION } from '../consts.ts';
 import { ref, onMounted, watch } from 'vue';
 import { loadDataDir, DataDir } from '../data-loader';
 import type { ModData } from '../data-types';
 import { sortByKey } from '../utils';
 import {
     TurnCoordinator,
     TurnState,
     MechabellumTurnInterface,
     ArmySnapshot,
     TechSnapshot,
     TechInfo,
 } from '../turn-coordinator';
 import { deepCopy } from '../utils';
 import PurchasedItem from './PurchaseItem.vue';
 import ArmyUnit from './ArmyUnit.vue';
 import NumberInput from './NumberInput.vue';

 import IconLoan from './icons/IconLoan.vue';
 import IconRecruit from './icons/IconRecruit.vue';
 import IconElite from './icons/IconElite.vue';
 import IconRange from './icons/IconRange.vue';
 import IconSpeed from './icons/IconSpeed.vue';
 import IconRecycle from './icons/IconRecycle.vue';
 import IconOil from './icons/IconOil.vue';
 import IconMobileBeacon from './icons/IconMobileBeacon.vue';
 import IconAttackHat from './icons/IconAttackHat.vue';
 import IconDefenseHat from './icons/IconDefenseHat.vue';
 import IconCircle from './icons/IconCircle.vue';
 import IconCheck from './icons/IconCheck.vue';
 import IconBoard from './icons/IconBoard.vue';
 import IconMech from './icons/IconMech.vue';
 import IconRocket from './icons/IconRocket.vue';
 import IconShieldGenerator from './icons/IconShieldGenerator.vue';
 import IconGun from './icons/IconGun.vue';

 const props = defineProps<{
     turnNumber: number,
     coordinator: TurnCoordinator,
 }>();

 const dataDir: DataDir = await loadDataDir(CURRENT_VERSION);
 const reinforcements = dataDir.modsForTags(["Reinforcement"]).sort(sortByKey("name"));
 const starters = dataDir.modsForTags(["Starter"]).sort(sortByKey("name"));
 const startUnits = dataDir.startData;

 const selectedReinforcement = (props.turnNumber === 1 ? ref('Aerial Specialist') : ref('Skip'));
 const selectedUnlockableUnit = ref("");
 const selectedStartUnits = ref("CRAWLER / SLEDGEHAMMER");
 const recoveredUnit = ref("");
 const setRecoveredUnit = (ident: string) => {
     recoveredUnit.value = ident === recoveredUnit.value ? "" : ident;
     change();
 };

 const startingSupply = ref(0);
 const transactions = ref([]);
 const leftoverSupply = ref(0);
 const army: ArmySnapshot = ref({});
 const mechSlots = ref(["", ""]);

 const selectedTechUnit = ref("");
 const techs = ref(props.coordinator.techs.techs);
 const clickTech = (techName: string) => {
     const prior = techs.value[selectedTechUnit.value][techName].boughtOn;
     let newValue = props.turnNumber;
     const techCount = Object
	 .values(techs.value[selectedTechUnit.value])
	 .filter((v: {boughtOn: number}) => v.boughtOn < 999)
	 .length;
     if (prior === props.turnNumber || techCount === 4) {
	 newValue = 999;
     }
     techs.value[selectedTechUnit.value][techName].boughtOn = newValue;
     change();
 };

 const towerButtons = ref({
     "Rapid Resupply": false,
     "Mass Recruitment": false,
     "Elite Recruitment": false,
     "Enhanced Range": false,
     "High Mobility": false,

     "Oil": false,
     "Field Recovery": false,
     "Mobile Beacon": false,
     "Tower Attack": false,
     "Tower Defense": false,
 });

 const devices = {
     "Sentry Missile": ref(0),
     "Shield Generator": ref(0),
     "Missile Interceptor": ref(0),
 };
 Object.values(devices).forEach((value) => {
     watch(value, () => {
	 change();
     })
 });
 const deviceUpdate = (oldValue: number, newValue: number, delta: number): number => {
     const total = Object
	 .values(devices)
	 .reduce((a, d) => a + d.value, 0);
     if (total === 8 && delta === 1) {
	 return oldValue;
     }
     if (newValue < 0) {
	 return oldValue;
     }
     return newValue;
 }

 const levelUps = ref(new Set<number>());
 const levelUpUnit = (ident: number) => {
     if (levelUps.value.has(ident)) {
	 levelUps.value.delete(ident);
     } else {
	 levelUps.value.add(ident);
     }
     change();

 };

 const price = (techName: string): number => {
     const priorTechs: number = Object
	 .values(techs.value[selectedTechUnit.value])
	 .reduce((acc: number, techInfo: TechInfo): number => acc + (techInfo.boughtOn <= props.turnNumber ? 1 : 0), 0);
     return priorTechs * 200 + techs.value[selectedTechUnit.value][techName].price;
 };

 function toggleTowerButtons(property: string) {
     towerButtons.value[property] = !towerButtons.value[property];
     props.coordinator.generateTurns();
 }


 function change() {
     props.coordinator.generateTurns();
 }

 function update(state: TurnState) {
     startingSupply.value = state.startingSupply;
     leftoverSupply.value = state.leftoverSupply;
     transactions.value = state.transactions;
     mechSlots.value = deepCopy(state.mechSlots);
     towerButtons.value = deepCopy(state.towerButtons);
     army.value = state.army;
     recoveredUnit.value = state.recoveredUnit;
     selectedUnlockableUnit.value = state.unitUnlock;
 }

 function isStartingTurn() {
     return props.turnNumber === 1;
 }

 onMounted(() => {
     props.coordinator.addTurn(new MechabellumTurnInterface({
	 turnNumber: props.turnNumber,
	 update: update,
	 reinforcement: selectedReinforcement,
	 unitUnlock: selectedUnlockableUnit,
	 startingUnits: props.turnNumber === 1 ? selectedStartUnits : ref(""),
	 towerButtons: towerButtons,
	 mechSlots: mechSlots,
	 recoveredUnit: recoveredUnit,
	 levelUps: levelUps,
	 tech: techs,
	 devices: devices,
     }));
     change();
 });
</script>


<template>
    <div class="turn-container">
	<div>
	    <!-- Column 1 -->
	    <h2>
		Turn {{ props.turnNumber  }}
	    </h2>
	    <div class="total-line">
		<div> Starting Supply</div>
		<div></div>
		<div>{{ startingSupply  }}</div>
	    </div>
	    <div>
		<ul>
		    <li v-for="(transaction, index) in transactions" v-bind:key="index">
			<PurchasedItem>
			    <template #name>{{ transaction.name }}</template>
			    <template #amount>{{ transaction.price * -1 }}</template>
			</PurchasedItem>
		    </li>
		</ul>
	    </div>
	    <div class="total-line">
		<div> Leftover Supply</div>
		<div></div>
		<div :class="{red: leftoverSupply < 0, green: leftoverSupply > 0}">{{ leftoverSupply }}</div>
	    </div>
	</div>

	<div>
	    <!-- Column 2 -->
	    <div class="turn-choice" v-if="!isStartingTurn()">
		<div>Reinforcement:</div>

		<v-select
		    @option:selected="change"
		    :clearable="false"
		    :options="reinforcements.map((r) => r.name)"
		    label="name"
		    v-model="selectedReinforcement"
		/>
	    </div>

	    <div class="turn-choice" v-if="isStartingTurn()">
		<div>Specialist:</div>

		<v-select
		    @option:selected="change"
		    :clearable="false"
		    :options="starters.map((starter) => starter.name).sort()"
		    v-model="selectedReinforcement"
		/>
	    </div>

	    <div class="turn-choice" v-if="isStartingTurn()">
		<div>Units:</div>

		<v-select
		    @option:selected="change"
		    :clearable="false"
		    :options="startUnits.map((units) => units.join(' / ')).sort()"
		    v-model="selectedStartUnits"
		/>
	    </div>

	    <div class="turn-choice">
		<div>Unit Unlock:</div>

		<v-select
		    :options="army.lockedUnits"
		    v-model="selectedUnlockableUnit"
		    :closeOnSelect="true"
		    @update:modelValue="(v) => { selectedUnlockableUnit = v === null ? '' : v ; change(); }"
		/>
	    </div>

	    <div class="turn-choice" v-for="(n, index) in mechSlots" v-bind:key="`${index}=${n}`">
		<div>Purchase Mech {{ index + 1}}:</div>

		<v-select
		    :options="army.unlockedUnits"
		    v-model="mechSlots[index]"
		    :closeOnSelect="true"
		    @update:modelValue="(v) => { mechSlots[index] = v === null ? '' : v ; change(); }"
		/>
	    </div>

	    <div class="command-center-bar">
		<div>Command Center</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Rapid Resupply']}"
		     title="Rapid Resupply" @click="toggleTowerButtons('Rapid Resupply')">
		    <IconLoan />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Mass Recruitment']}"
		     title="Mass Recruitment" @click="toggleTowerButtons('Mass Recruitment')">
		    <IconRecruit/>
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Elite Recruitment']}"
		     title="Elite Recruitment" @click="toggleTowerButtons('Elite Recruitment')">
		    <IconElite/>
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Enhanced Range']}"
		     title="Enhanced Range" @click="toggleTowerButtons('Enhanced Range')">
		    <IconRange />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['High Mobility']}"
		     title="High Mobility" @click="toggleTowerButtons('High Mobility')">
		    <IconSpeed />
		</div>

	    </div>

	    <div class="research-center-bar">
		<div>Research Center</div>

		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Oil']}"
		     title="Oil" @click="toggleTowerButtons('Oil')">
		    <IconOil />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Field Recovery']}"
		     title="Field Recovery" @click="toggleTowerButtons('Field Recovery')">
		    <IconRecycle />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Mobile Beacon']}"
		     title="Mobile Beacon" @click="toggleTowerButtons('Mobile Beacon')">
		    <IconMobileBeacon />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Tower Attack']}"
		     title="Tower Attack" @click="toggleTowerButtons('Tower Attack')">
		    <IconAttackHat />
		</div>
		<div class="icon-button large clickable" :class="{'icon-button-selected': towerButtons['Tower Defense']}"
		     title="Tower Defense" @click="toggleTowerButtons('Tower Defense')">
		    <IconDefenseHat />
		</div>
	    </div>

	    <div class="device-bar">
		<div>Devices</div>
		<div class="stat-pair">
		    <div class="icon-button large"><IconRocket /></div>
		    <NumberInput :value="devices['Sentry Missile']" :update="deviceUpdate" />
		</div>

		<div class="stat-pair">
		    <div class="icon-button large"><IconShieldGenerator /></div>
		    <NumberInput :value="devices['Shield Generator']" :update="deviceUpdate" />
		</div>

		<div class="stat-pair">
		    <div class="icon-button large"><IconGun /></div>
		    <NumberInput :value="devices['Missile Interceptor']" :update="deviceUpdate" />
		</div>
	    </div>

	    <div class="tech-bar">
		<div class="tech-header">
		    <div>Tech</div>
		    <v-select
			@option:selected="change"
			:options="Object.keys(techs).sort()"
			v-model="selectedTechUnit"
		    />
		</div>

		<div
		    class="tech-options" v-for="tech in techs[selectedTechUnit]" v-bind:key="tech.name">
		    <div class="icon-button small clickable" @click="clickTech(tech.name)">
			<component
			    v-bind:is="techs[selectedTechUnit][tech.name].boughtOn <= props.turnNumber ? IconCheck : IconCircle"
			    :class="{'icon-button-selected': techs[selectedTechUnit][tech.name].boughtOn <= props.turnNumber}"
			/>
		    </div>
		    <div class="clickable" @click="clickTech(tech.name)">
			{{ price(tech.name) }}
		    </div>
		    <div class="clickable" @click="clickTech(tech.name)">
			{{ tech.name }}
		    </div>
		</div>
	    </div>

	</div>

	<div class="army-container">
	    <div class="army-stats">
		<div class="stat-pair">
		    <div class="icon-button small" title="Value on board">
			<IconBoard />
		    </div>
		    <div title="Value on board">
			{{ army.valueOnBoard }}
		    </div>
		</div>

		<div class="stat-pair">
		    <div class="icon-button small" title="Deployment opportunity ratio">
			<IconMech />
		    </div>
		    <div title="Deployment opportunity ratio">
			<span title="Deployments used">{{ army.unitCount }}</span>
			/
			<span title="Total deployment opportunities"> {{ army.deploymentOpportunities }}</span>
		    </div>
		</div>
	    </div>
	    <div class="unit-list">
		<!-- Column 3 -->
		<div v-for="unit in army.units" v-bind:key="`army-unit-${unit.ident}`">
		    <ArmyUnit
			:unit="unit"
			:recover-unlocked="towerButtons['Field Recovery']"
			:recovered-unit="recoveredUnit"
			:set-recovered="setRecoveredUnit"
			:level-ups="levelUps"
			:level-up="levelUpUnit"
			:techs="techs"
		    />
		</div>
	    </div>
	</div>

    </div>
</template>


<style scoped>
 .turn-container {
     background-color: var(--color-background-soft);
     padding: 10px;

     display: grid;
     grid-template-rows: 1fr;
     grid-template-columns: 1fr 1fr 1fr;
     grid-column-gap: 2em;
 }

 ul {
     border-bottom: 1px solid var(--color-border);
     border-top: 1px solid var(--color-border);
 }

 li {
     list-style-type: none;
 }

 .total-line {
     display: grid;
     grid-template-columns: auto 1fr auto;
 }

 .turn-column {
     display: grid;
     grid-template-columns: 1fr;
 }

 .turn-choice {
     display: grid;
     grid-template-columns: auto 1fr ;
     grid-column-gap: 0.5em;
     margin: 0.5em 0;
     align-items: center;
 }

 .red {
     color: var(--color-text-negative);
 }

 .green {
     color: var(--color-text-accent);
 }

 .command-center-bar {
     display: grid;
     grid-template-columns: auto auto auto auto auto auto 1fr;
     grid-column-gap: 1em;
     border-top: 1px solid var(--color-border);
     padding: 0.5em;
     margin-top: 1em;
 }
 .research-center-bar {
     display: grid;
     grid-template-columns: auto auto auto auto auto 1fr;
     grid-column-gap: 1em;
     border-top: 1px solid var(--color-border);
     padding: 0.5em;
     margin-top: 1em;
 }

 .device-bar {
     display: grid;
     grid-template-columns: auto auto auto auto auto auto 1fr;
     grid-column-gap: 1em;
     border-top: 1px solid var(--color-border);
     padding: 0.5em;
     margin-top: 1em;
     align-items: center;
 }

 .tech-bar {
     display: grid;
     border-top: 1px solid var(--color-border);
     padding: 0.5em;
     grid-row-gap: 0.5em;
 }

 .tech-header {
     display: grid;
     grid-template-columns: auto 1fr;
     grid-column-gap: 1em;
 }

 .tech-options {
     display: grid;
     grid-template-columns: 30px auto auto 1fr;
     grid-column-gap: 5px;
     align-items: center;
 }

 .small {
     width: 1.5em;
     height: 1.5em;
 }

 .large {
     width: 32px;
     height: 32px;
 }

 .icon-button::v-deep(.bgPath) {
     fill: var(--color-background-soft);
 }

 .icon-button::v-deep(.fgPath) {
     fill: var(--color-text);
 }
 .icon-button-selected::v-deep(.fgPath) {
     fill: var(--color-text-accent);
 }

 .army-container {
     display: grid;
     grid-template-rows: auto 1fr;
     row-gap: 1em;
 }

 .army-stats {
     border-bottom: 1px solid var(--color-border);
     display: grid;
     grid-template-columns: 1fr 1fr;
 }

 .stat-pair {
     display: grid;
     grid-template-columns: auto auto 1fr;
     grid-column-gap: 0.5em;
     align-items: center;
 }

 .unit-list {
     display: grid;
     grid-auto-rows: 35px;
     grid-row-gap: 5px;
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
