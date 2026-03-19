<script setup>
import { ref } from 'vue'
import global from '../../shared/global.js'
import { ElNotification } from 'element-plus'
import Datapack from '../../shared/datapack.js'
import { save } from '../../shared/saves.js'
import { clearAndLoad } from '../../shared/plugin.js'
import Filesystem from '../../shared/filesystem.js'

const menu = ref(undefined);

async function handleSelect(selection) {
  console.log(selection);
  menu.value.updateActiveIndex("empty");

  switch (selection) {
    case "file.open":
      const rawHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        id: "workspace"
      });
      const datapack = new Datapack(rawHandle);
      const errorcallback = [];
      const retCode = await datapack.init(errorcallback);
      switch (retCode) {
        case 0:
          global.open.value = datapack;
          const dirObj = await datapack.writeDir();
          global.dirs.value = dirObj;
          // global.data_list.value = dirObj.data?.type === 'dir' ? dirObj.data.contents : {};
          global.openCallback.forEach(v => v());
          break;
        case -1:
          ElNotification({
            title: "mods.toml打开失败",
            message: "请检查是否存在META-INF/mods.toml"
          });
          return;
        case -2:
          ElNotification({
            title: "mods.toml格式不正确",
            message: errorcallback[0].toString()
          });
          return;
      }
      break;
    case "file.save":
      console.log("save");
      await save();
      break;
    case "plugin.add":
      const rawHandleP = await window.showDirectoryPicker({
        mode: "readwrite",
        id: "plugin"
      });
      await clearAndLoad(new Filesystem(rawHandleP));
      break;
  }
}
</script>

<template>
  <el-menu
    default-active="empty"
    ref="menu"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <el-menu-item style="display: none" index="empty"></el-menu-item>
    <el-sub-menu index="file">
      <template #title>文件</template>
      <el-menu-item index="file.open">打开</el-menu-item>
      <el-menu-item index="file.save"
                    :disabled="!(global.open.value instanceof Datapack)">
        保存
      </el-menu-item>
    </el-sub-menu>
    <el-sub-menu index="plugin">
      <template #title>插件</template>
      <el-menu-item index="plugin.add">添加</el-menu-item>
      <el-menu-item index="plugin.manage">管理</el-menu-item>
    </el-sub-menu>
    <el-menu-item style="pointer-events: none">{{ global.open.value?.name }}</el-menu-item>
  </el-menu>
</template>

<style scoped>
.el-menu--horizontal > .el-sub-menu:nth-child(3) {
  margin-right: auto;
}
</style>