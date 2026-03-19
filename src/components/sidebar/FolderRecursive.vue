<script setup>
  import { Folder, Document, FolderAdd, DocumentAdd } from '@element-plus/icons-vue'
  import { sep } from 'path-browserify';

  const { prefix, folder, sentinal, ctxmenu } = defineProps(["prefix", "folder", "sentinal", "ctxmenu"]);

  const uuid = () => crypto.randomUUID();



  function compare(obj1, obj2) {
    if (obj1[1].type !== obj2[1].type) {
      return obj1[1].type === 'dir' ? -1 : 1;
    }
    return obj1[0].localeCompare(obj2[0]);
  }
</script>

<template>
  <el-sub-menu :index="`data:${prefix}`">
    <template #title>
      <el-icon><Folder /></el-icon>
      <span :class="sentinal">{{ prefix.split(sep).at(-1) }}</span>
    </template>
    <template v-for="([key, value, uuid]) in Object.entries(folder.contents).sort(compare).map(v => [v[0], v[1], uuid()])">
      <FolderRecursive
        :basetype="basetype"
        :basedir="basedir"
        :prefix="`${prefix}${sep}${key}`"
        :folder="value"
        :sentinal="`sentinal_folder_${uuid}`"
        v-if="value.type === 'dir'"
        @contextmenu="(e) => ctxmenu(`${prefix}${sep}${key}`, uuid, e)"
        :ctxmenu="ctxmenu"
      />
      <el-menu-item :index="`data-file:${prefix}${sep}${key}`" v-if="value.type !== 'dir'">
        <el-icon><Document /></el-icon>
        <span>{{ key }}</span>
      </el-menu-item>
    </template>
    <el-menu-item :index="`data.create-folder-generic:${prefix}`">
      <el-icon><FolderAdd /></el-icon>新建文件夹
    </el-menu-item>
    <el-menu-item :index="`data.create-file-generic:${prefix}`">
      <el-icon><DocumentAdd /></el-icon>新建文件
    </el-menu-item>
  </el-sub-menu>
</template>