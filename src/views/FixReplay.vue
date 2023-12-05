<script setup lang="ts">
 import { ref, onMounted } from 'vue';
 import { Replay } from '../replay';
 import { REPLAY, CURRENT_VERSION } from '../consts';
 import { XMLParser, XMLBuilder, XMLValidator} from "fast-xml-parser";

 import DropZone from '../components/DropZone.vue';
 import DownloadReplayButton from '../components/DownloadReplayButton.vue';

 const files = ref([]);

 const options = {
     ignoreAttributes: false,
     attributeNamePrefix : "@_",
     format: true,
     suppressEmptyNode: true,
 };

 const update = (obj) => {
     console.log(obj);
     obj.BattleRecord.playerRecords.PlayerRecord.map(updatePlayerRecord);
 }


 const updatePlayerRecord = (playerRecord) => {
     playerRecord.playerRoundRecords.PlayerRoundRecord.map(updatePlayerRoundRecord);
 };


 const updatePlayerRoundRecord = (playerRoundRecord) => {
     updateActions(playerRoundRecord.actionRecords.MatchActionData);
 };


 const updateActions = (action) => {
     if (Array.isArray(action)) {
	 action.map(updateAction);
     } else {
	 updateAction(action, 1);
     }
 };


 const updateAction = (action, index) => {
     action.LocalTime = index;
     action.Time = index;
 };


 const filesDropped = (values) => {
     values.forEach((value) => {
	 processFile(value);
     });
 }

 const processFile = (fileObj) => {
     fileObj.text().then((text) => {
	 const parser = new XMLParser(options);
	 let jObj = parser.parse(text);
	 update(jObj);
	 const builder = new XMLBuilder(options);
	 // Need windows line endings or mechabellum refuses to parse the file.
	 const xmlContent = builder.build(jObj).replace(/(\r\n|\r|\n)/g, '\r\n');
	 files.value.push([fileObj.name, xmlContent]);
     })

 };

</script>

<template>
    <h1>Replay shortener</h1>
    <div>
	<p>For now, the replay shortener updates all of the actions in a replay to be 1 second apart. This makes it a lot faster to watch replays since all of thinking delays are replaced by 1 second intervals.</p>
	<p>This can also be used to fix replays that are stuck in selection on turn 0.</p>
	<p>To use drag replay files to the box below. Once they have been updated you can download the modified replays to the right by clicking the download link that appears.</p>
    </div>
    <div class="fix-replay-container">
	<div>
	    <DropZone @files-dropped="filesDropped">Drag replay file(s) here</DropZone>
	</div>
	<div class="replay-results">
	    <div v-for="[name, xmlContent] in files">
		<DownloadReplayButton :filename="name" :xmlContent="xmlContent">
		</DownloadReplayButton>
	    </div>
	</div>
    </div>
</template>


<style scoped>
 .fix-replay-container {
     display: grid;
     grid-template-columns: 1fr 1fr;
     grid-column-gap: 1em;
 }

 .replay-results {
     display: grid;
     grid-auto-rows: min-content;
 }
</style>
