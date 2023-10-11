import './assets/main.css'
import "vue-select/dist/vue-select.css";

import vSelect from "vue-select";

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import LvColorpicker from 'lightvue/color-picker';
import LvButton from 'lightvue/button';


const app = createApp(App)
app.component("v-select", vSelect);
app.component("LvColorpicker", LvColorpicker);
app.component("LvButton", LvButton);
app.use(router);
app.mount('#app')
