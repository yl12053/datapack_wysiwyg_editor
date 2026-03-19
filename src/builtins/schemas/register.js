import Schema from '../schema/schema.vue'

const modules = import.meta.glob("./schemas/*.json");

export default async function registerSchema(pluginList, SchemaPlugin) {
  await Promise.all(Object.entries(modules).map(async ([key, value]) => {
    pluginList.push({
      plugin: new SchemaPlugin(await value(), Schema, key),
      enabled: true
    });
  }));
}