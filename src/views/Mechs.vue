<script setup>
 import { CURRENT_VERSION } from '../consts';
 import { loadDataDir } from '../data-loader';
 const dataDir = await loadDataDir(CURRENT_VERSION);
</script>

<template>
    <li v-for="name in dataDir.mechNames()">
	<router-link :to="`/mech-details/${name}`">{{ name }}</router-link>
    </li>
</template>
