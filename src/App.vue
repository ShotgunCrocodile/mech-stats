<script setup lang="ts">
</script>

<template>
 <router-view v-slot="{ Component }">
    <suspense timeout="0">
	<template #default>
	    <div class-="root-container">
		<div class="header">
		    <h1><a href="/">Overlord.gg</a></h1>
		</div>
		<div class="main">
		    <component :is="Component" :key="$route.path"></component>
		</div>
		<div class="footer">
		    <div>&copy; 2023 Overlord.gg</div>
		    <div>
			<a href="/links">related links</a>
		    </div>
		</div>
	    </div>
      </template>

      <template #fallback>
          <div>Loading...</div>
      </template>
    </suspense>
 </router-view>
</template>

<style scoped>

 root-container {
     display: grid;
     grid-template-areas:
	 "header header header"
	 "main main right"
	 "main main right"
	 "footer footer footer";
 }

 .header {
     line-height: 1.5;
     max-height: 100vh;
     grid-row-start: header;
     color: var(--color-text-accent);
     background-color: var(--color-background);
     border-bottom: 1px solid var(--color-border);
     padding-bottom: 5px;
 }

 .header a {
     text-decoration: none;
 }

 .footer {
     grid-row-start: footer;
     border-top: 1px solid var(--color-border);
     padding: 5px;
     margin: 5px;

     display: grid;
     grid-template-columns: 1fr auto;
 }

 .main {
     grid-row-start: main;
 }

</style>
