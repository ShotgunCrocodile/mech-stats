<script setup lang="ts">
 import LinkPageItem from '../components/LinkPageItem.vue';
</script>

<template>
    <div class="links-container">
	<h1>Related links</h1>

	<LinkPageItem url="https://game-icons.net">
	    <template #link>Game-icons.net</template>
	    <template #text>
		All icons and graphics used on this site were sourced from the awesome <a href="https://game-icons.net">game-icons.net</a>.
	    </template>
	</LinkPageItem>

	<LinkPageItem url="https://store.steampowered.com/app/669330/Mechabellum/">
	    <template #link>Mechabellum on Steam</template>
	    <template #text>
		Steam store page for Mechabellum.
	    </template>
	</LinkPageItem>

	<LinkPageItem url="https://discord.gg/meVmu4zg">
	    <template #link>Official Discord</template>
	    <template #text>
		Developer maintained Discord server.
	    </template>
	</LinkPageItem>

  </div>
</template>

<style>
@media (min-width: 1024px) {
    .links-container {
	min-height: 90vh;
	display: grid;
	grid-template-rows: auto auto auto auto 1fr;
	grid-row-gap: 10px;
    }
}
</style>
