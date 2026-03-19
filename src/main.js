import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import EsIcons from '@element-plus/icons-vue/global'
import global from './shared/global.js'

import * as ElementPlusIconVue from '@element-plus/icons-vue';
import { registerInternalPlugins } from './shared/plugin.js'

const app = createApp(App).use(ElementPlus).use(EsIcons);
global.app = app;

for (const [key, component] of Object.entries(ElementPlusIconVue)) {
  app.component(key, component);
}

await registerInternalPlugins();

app.mount('#app');

window.jsonUtils = {
  parseOrDefault (src, def) {
    console.log("Parse: src = ", src);
    console.log("Def = ", def);
    const structured = structuredClone(def);
    try {
      const k = JSON.parse(src);
      for (let [key, val] of Object.entries(k)) {
        structured[key] = val;
      }
    } catch (e) {}
    console.log("Final: ", structured);
    return structured;
  },

  dumpDefault (src, def) {
    console.log("Dump: ", src, def);
    const structured = structuredClone(def);
    for (let [key, val] of Object.entries(src)) {
      structured[key] = val;
    }
    console.log(structured);
    return JSON.stringify(structured);
  }
}