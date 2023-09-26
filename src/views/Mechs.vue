<script setup>
 import { loadDataDir } from '../data-loader';
 const dataDir = await loadDataDir("0.7.24");
</script>

<template>
    <li v-for="name in dataDir.mechNames()">
	<router-link :to="`/mech-details/${name}`">{{ name }}</router-link>
    </li>
</template>
