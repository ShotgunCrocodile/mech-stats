<script setup lang="ts">
 import { ref } from 'vue';
 import { createReplay, Replay } from '../replay.ts';
import ReplayPlayer from '../components/ReplayPlayer.vue';

 const replay = ref();

 function change(ev)  {
     const file = ev.target.files[0];
     const reader = new FileReader();

     reader.onload = function fileReadCompleted() {
	 replay.value = createReplay(reader.result);
     };
     reader.readAsText(file);
 }
</script>

<template>
    <input type="file" id="file-selector" accept=".grbr" @change="change">

    <div class="player-container">
	<div v-if="replay !== undefined" v-for="player in replay.players">
	    <ReplayPlayer :player="player" :key="player.name" />
	</div>
    </div>
</template>


<style scoped>
 .player-container {
     display: grid;
     grid-template-columns: 1fr 1fr;
     grid-column-gap: 0.5em;

     background-color: blue;
 }
</style>
