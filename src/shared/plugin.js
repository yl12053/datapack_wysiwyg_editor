import * as Vue from 'vue'
import { computed, defineComponent, ref } from 'vue'
import global from './global.js'
import { loadModule } from 'vue3-sfc-loader'

import Text from '../builtins/text/text.vue';
import Json from '../builtins/json/json.vue';

const loaded = ref([]);
const calculatedLoaded = computed(() =>
  loaded.value.concat(internalPlugins).toSorted((a, b) => b.plugin.priority - a.plugin.priority)
);

const options = {
  moduleCache: {
    vue: Vue
  },

  getPathname(url) {
    return "component.vue";
  },

  async getFile(url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw Object.assign(new Error(res.statusText + ' ' +url), { res });
    }
    return await res.text();
  },

  addStyle(textContent) {
    const style = Object.assign(document.createElement("style"), { textContent });
    const ref = document.head.getElementsByTagName("style")[0] || null;
    document.head.insertBefore(style, ref);
  }
}

let shared = 0;

class Plugin {
  $pathMatch;
  $componentName;
  $descname;
  $json;

  constructor(json, componentFile, descname) {
    this.$componentName = `c${shared++}`;
    this.$pathMatch = new RegExp(json.match);
    this.$descname = descname;
    console.log(json);
    this.$json = ref(json);
    console.log(this.$json);
    this.$componentFile = componentFile;
    this.defineComponent();
  }

  defineComponent() {
    const url = URL.createObjectURL(this.$componentFile);
    const component = Vue.defineAsyncComponent(() => loadModule(url, options));
    global.app.component(this.$componentName, component);
  }

  get componentName() {
    return this.$componentName;
  }

  get name() {
    return this.name;
  }

  get priority() {
    try {
      return JSON.parse(window.localStorage.getItem("plugin_priority"))[this.$json.value.identifier] ?? (this.$json.value.priority ?? 0);
    } catch (e) {
      console.error(e);
      return this.$json.value.priority ?? 0;
    }
  }

  isMatch(path) {
    return path.match(this.$pathMatch);
  }
}

class InternalPlugin extends Plugin {
  defineComponent() {
    console.log("Defining");
    console.log("Component:", this.$componentFile);
    global.app.component(this.$componentName, this.$componentFile);
  }
}

const matchCache = ref({});
const internalPlugins = [];

export async function registerInternalPlugins() {
  console.log("Registering");
  internalPlugins.push({plugin: new InternalPlugin({
    identifier: "builtins.text",
    match: ".*",
    priority: -10
  }, Text, "builtins.text"), enabled: true});
  internalPlugins.push({plugin: new InternalPlugin({
      identifier: "builtins.json",
      match: "^.*\.[jJ][sS][oO][nN]$",
      priority: -1
  }, Json, "builtins.json"), enabled: true});
}

export async function clearAndLoad(fs) {
  const newValue = [];
  const readDirValue = await fs.readdir(".");
  (await Promise.allSettled(readDirValue.map(async (dirname) => {
    const descJson = JSON.parse(await fs.read(`${dirname}/desc.json`));
    const vueBlob = await fs.getRawBlob(`${dirname}/component.vue`);
    return new Plugin(descJson, vueBlob, dirname);
  }))).forEach(v => {
    let { status, value, reason } = v;
    if (status === "fulfilled") {
      newValue.push(value);
    } else {
      console.error("Error loading:", reason);
    }
  });
  newValue.sort.map((v) => ({plugin: v, enabled: true}));
  loaded.value = newValue;
  matchCache.value = {};
}

export function findMatchPlugin(path) {
  if (matchCache.value[path] !== undefined) return matchCache.value[path] ? matchCache.value[path] : undefined;
  console.log(path);
  console.log(calculatedLoaded.value);
  for (let pluginDesc of calculatedLoaded.value) {
    if (!pluginDesc.enabled) continue;
    const plugin = pluginDesc.plugin;
    console.log(plugin.$pathMatch);
    if (plugin.isMatch(path)) {
      console.log("Match ", plugin);
      matchCache.value[path] = plugin.componentName;
      return plugin.componentName;
    }
  }
  matchCache.value[path] = false;
}