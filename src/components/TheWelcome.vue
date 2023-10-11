<script setup lang="ts">
 import IconCalculator from './icons/IconCalculator.vue';
 import IconAbacus from './icons/IconAbacus.vue';
 import IconPlay from './icons/IconPlay.vue';
 import IconBoard from './icons/IconBoard.vue';
 import WelcomeItem from './WelcomeItem.vue';
</script>

<template>
	<WelcomeItem>
	    <template #icon>
		<IconCalculator />
	    </template>

	    <template #title>
		<a href="/mm">
		    Unit stat calculator
		</a>
	    </template>

	    Calculate unit stats by applying any number of unit modifiers such astech, specialists, and unit reinforcment cards.
	</WelcomeItem>


	<WelcomeItem>
	    <template #icon>
		<IconAbacus />
	    </template>

	    <template #title>
		<a href="/build-planner">
		    Build simulator
		</a>
	    </template>

	    Calculate how much cash you have on a turn given any combination of specialists and purchases.
	</WelcomeItem>

	<WelcomeItem>
	    <template #icon>
		<IconBoard />
	    </template>

	    <template #title>
		<a href="/map">
		    Map vizualizer
		</a>
	    </template>

	    Map vizualizer tool that allows you to place units on a representation of the game board. Can generate permanent links to share formations.
	</WelcomeItem>

</template>
