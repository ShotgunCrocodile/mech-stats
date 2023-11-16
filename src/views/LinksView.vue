<script setup lang="ts">
 import LinkPageItem from '../components/LinkPageItem.vue';
</script>

<template>
    <div class="links-container">
	<div>
	    <h2>Community Resources</h2>

	    <LinkPageItem url="https://mechamonarch.com/">
		<template #link>MechaMonarch</template>
		<template #text>
		    Community site run by SurryEZ, a high level player. Here you will find ways to improve your Mechabellum game play and keep informed about the community.
		</template>
	    </LinkPageItem>
	</div>

	<div>
	    <h2>Official Links</h2>

	    <LinkPageItem url="https://discord.gg/meVmu4zg">
		<template #link>Official Discord</template>
		<template #text>
		    Developer maintained Discord server.
		</template>
	    </LinkPageItem>

	    <LinkPageItem url="https://store.steampowered.com/app/669330/Mechabellum/">
		<template #link>Mechabellum on Steam</template>
		<template #text>
		    Steam store page for Mechabellum.
		</template>
	    </LinkPageItem>

	</div>
	<div>
	    <h2>Technical Credits</h2>
	    <LinkPageItem url="https://game-icons.net">
		<template #link>Game-icons.net</template>
		<template #text>
		    All icons and graphics used on this site were sourced from the awesome <a href="https://game-icons.net">game-icons.net</a>.
		</template>
	    </LinkPageItem>

	    <LinkPageItem url="https://discordapp.com/users/155761751860707328">
		<template #link>Ghirahn</template>
		<template #text>
		    Painstakingly counted the number of units spawned when something is killed by a unit with replicate or parasitic ammo.
		</template>
	    </LinkPageItem>

	</div>

	<div></div>

    </div>
</template>

<style>
@media (min-width: 1024px) {
    .links-container {
	min-height: 90vh;
	display: grid;
	grid-template-rows: auto auto auto 1fr;
	grid-row-gap: 2em;
    }
 }

 h2 {
     color: var(--color-heading);
 }
</style>
