import { computed, ref, toRaw } from 'vue'

const dirs = ref({});
const temp = {};
const open = ref();
export async function getOrCreateWritable(path) {
  console.log(`Receive new from ${path}`);
  if (temp[path]) {
    console.log(`Found from`, temp);
    return temp[path];
  }
  const defaultVal = await open.value.filesystem.read(path);
  return computed({
    get: () => temp[path] ?? defaultVal,
    set: (val) => {
      temp[path] = val;
    }
  });
}

export async function readWithCache(path) {
  return temp[path] ?? await open.value.filesystem.read(path);
}

export function writeToCache(text, path) {
  console.log("Write");
  temp[path] = text;
}

export default {
  openCallback: [],
  open,
  data_list: computed({
    get: () => dirs.value.data?.type === 'dir' ? dirs.value.data.contents : {},
    set: (val) => {
      dirs.value.data = {
        type: 'dir',
        contents: val
      }
    }
  }),
  dirs,
  temp
};