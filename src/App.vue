<script setup>
import Nav from './components/nav/Nav.vue'
import global, { getOrCreateWritable, readWithCache, writeToCache } from './shared/global.js'
import Datapack from './shared/datapack.js'
import { FolderAdd, SetUp, Tools } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import BasicInfo from './components/basic/basicInfo.vue'
import Dependencies from './components/basic/dependencies.vue'
import { findMatchPlugin } from './shared/plugin.js'
import { ElMessageBox, ElNotification } from 'element-plus'
import FolderRecursive from './components/sidebar/FolderRecursive.vue'
import Text from './builtins/text/text.vue'

import { sep } from 'path-browserify'

const lastSelect = ref("");

const mainMenu = ref();
function onMenu(part) {
  if (interrupt(part)) {
    mainMenu.value.updateActiveIndex(lastSelect.value);
  } else {
    lastSelect.value = part;
  }
}

function interrupt(part) {
  switch (part) {
    case "data.add-namespace":
      creatingNamespaceForm.value = { name: "" };
      isCreatingNamespace.value = true;
      namespaceForm.value?.clearValidate();
      return true;
  }
  if (part.startsWith("data.add-type:")){
    creatingTypeForNamespace.value = part.substring(14);
    creatingTypeForm.value = { name: "" };
    typeForm.value?.clearValidate();
    isCreatingType.value = true;
    return true;
  } else if (part.startsWith("data.create-folder-generic:")) {
    creatingFolderAt.value = part.substring(27);
    creatingFolderForm.value = { name: "" };
    folderForm.value?.clearValidate();
    isCreatingFolder.value = true;
    return true;
  }
  return false;
}

const isCreatingNamespace = ref(false);
const creatingNamespaceForm = ref({name: ""});
const namespaceForm = ref();
const namespaceRule = {
  name: [
    {required: true, message: "命名空间名不得为空", trigger: 'blur'},
    {validator: validateNamespace, trigger: 'blur'}
  ]
}

async function validateNamespace(rule, value, callback) {
  try {
    const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
    await dataHandle.getDirectoryHandle(value);
    callback(new Error("该命名空间已经存在"));
  } catch (e) {
    if (e instanceof TypeError) {
      callback(new Error("命名空间名不合法"));
    } else if (e instanceof DOMException) {
      if (e.name === "TypeMismatchError") {
        callback(new Error("data文件夹下存在同名文件 请手动检查"));
      } else if (e.name === "NotFoundError") {
        callback();
      } else {
        callback(e);
      }
    } else {
      callback(e);
    }
  }
}
async function submitNamespace() {
  if (!namespaceForm.value) return;
  const valid = await new Promise(namespaceForm.value.validate);
  if (valid) {
    const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
    await dataHandle.getDirectoryHandle(creatingNamespaceForm.value.name, {create: true});
    global.data_list.value[creatingNamespaceForm.value.name] = {
      type: 'dir',
      contents: {}
    };
    isCreatingNamespace.value = false;
  }
}

const isCreatingType = ref(false);
const creatingTypeForNamespace = ref();
const creatingTypeForm = ref({name: ""});
const typeForm = ref();
const typeRule = {
  name: [
    {required: true, message: "类别名不得为空", trigger: 'blur'},
    {validator: validateType, trigger: 'blur'}
  ]
}

async function validateType(rule, value, callback) {
  try {
    const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
    const namespaceHandle = await dataHandle.getDirectoryHandle(creatingTypeForNamespace.value, {create: true});
    await namespaceHandle.getDirectoryHandle(value);
    callback(new Error("该命名空间已经存在"));
  } catch (e) {
    if (e instanceof TypeError) {
      callback(new Error("类别名不合法"));
    } else if (e instanceof DOMException) {
      if (e.name === "TypeMismatchError") {
        callback(new Error(`data/${creatingTypeForNamespace.value}文件夹下存在同名文件 请手动检查`));
      } else if (e.name === "NotFoundError") {
        callback();
      } else {
        callback(e);
      }
    } else {
      callback(e);
    }
  }
}
async function submitType() {
  if (!typeForm.value) return;
  const valid = await new Promise(typeForm.value.validate);
  if (valid) {
    const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
    const namespaceHandle = await dataHandle.getDirectoryHandle(creatingTypeForNamespace.value, {create: true});
    await namespaceHandle.getDirectoryHandle(creatingTypeForm.value.name, {create: true});
    if (!global.data_list.value[creatingTypeForNamespace.value]) {
      global.data_list.value[creatingTypeForNamespace.value] = {
        type: 'dir',
        contents: {}
      };
    }
    global.data_list.value[creatingTypeForNamespace.value].contents[creatingTypeForm.value.name] = {
      type: 'dir',
      contents: {}
    }
    isCreatingType.value = false;
  }
}

const isCreatingFolder = ref(false);
const creatingFolderForm = ref({name: ""});
const creatingFolderAt = ref();
const folderForm = ref();
const folderRule = {
  name: [
    {required: true, message: "文件夹名不得为空", trigger: 'blur'},
    {validator: validateFolder, trigger: 'blur'}
  ]
}

async function validateFolder(rule, value, callback) {
  try {
    const rootFS = global.open.value.filesystem;
    const folderHandle = await rootFS.$getFolderHandle(creatingFolderAt.value);
    await folderHandle.getDirectoryHandle(value);
    callback(new Error("该文件夹已经存在"));
  } catch (e) {
    if (e instanceof TypeError) {
      callback(new Error("文件夹名不合法"));
    } else if (e instanceof DOMException) {
      if (e.name === "TypeMismatchError") {
        callback(new Error(`${creatingFolderAt.value}下存在同名文件 请手动检查`));
      } else if (e.name === "NotFoundError") {
        callback();
      } else {
        callback(e);
      }
    } else {
      callback(e);
    }
  }
}

async function submitFolder() {
  if (!folderForm.value) return;
  const valid = await new Promise(folderForm.value.validate);
  if (valid) {
    const rootFS = global.open.value.filesystem;
    const folderHandle = await rootFS.$getFolderHandle(creatingFolderAt.value, true);
    await folderHandle.getDirectoryHandle(creatingFolderForm.value.name, {create: true});
    let root = {contents: global.dirs.value};
    for (const part of creatingFolderAt.value.split(sep)) {
      console.log(root, part);
      if ((!root.contents[part]) || (root.contents[part].type !== 'dir')) {
        root.contents[part] = {
          type: 'dir',
          contents: {}
        }
      }
      root = root.contents[part];
    }
    root.contents[creatingFolderForm.value.name] = {
      type: 'dir',
      contents: {}
    };
    isCreatingFolder.value = false;
  }
}

const mousePosition = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
});

const contextTriggerRef = ref({
  getBoundingClientRect: () => mousePosition.value
});

function checkElementType(element, type) {
  while (element) {
    if (element.classList.contains("el-sub-menu__title")) break;
    element = element.parentElement;
  }
  if (!element) return false;
  return element.querySelector(`.sentinal_${type}`);
}

function resetAllMenu() {
  namespaceContextVisible.value = false;
  typeContextVisible.value = false;
  folderContextVisible.value = false;
}

const namespaceContextVisible = ref(false);
const namespaceContextName = ref();

function contextMenuNamespace(name, event) {
  if (!checkElementType(event.target, "namespace")) return;
  event.preventDefault();
  event.stopPropagation();
  resetAllMenu();
  mousePosition.value = DOMRect.fromRect({
    x: event.clientX,
    y: event.clientY
  });
  namespaceContextVisible.value = true;
  namespaceContextName.value = name;
}

async function onNamespaceContextMenu(key) {
  namespaceContextVisible.value = false;
  switch (key) {
    case "delete":
      try {
        await ElMessageBox.confirm(
          `确定删除命名空间 ${namespaceContextName.value} ?\n此举不可撤销`,
          `删除命名空间 ${namespaceContextVisible.value}`,
          {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning"
          }
        );
        const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
        await dataHandle.removeEntry(namespaceContextName.value, { recursive: true });
        ElNotification({
          type: 'success',
          message: "删除成功",
          title: `删除命名空间 ${namespaceContextName.value} 成功`
        });
        delete global.data_list.value[namespaceContextName.value];
      } catch (e) {
        if (e instanceof DOMException) {
          let message = "未知错误: " + e;
          switch (e.name) {
            case "NotFoundError":
              message = '该命名空间不存在';
              break;
            case "NotAllowedError":
              message = '系统不允许删除文件';
              break;
          }
          ElNotification({
            type: 'error',
            title: `删除命名空间 ${namespaceContextVisible.value} 失败`,
            message
          });
        }
      }
      break;
    case "create_type":
      interrupt(`data.add-type:${namespaceContextName.value}`);
      break;
  }
}

const typeMousePosition = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
});

const typeContextTriggerRef = ref({
  getBoundingClientRect: () => typeMousePosition.value
});

const typeContextVisible = ref(false);
const typeContextName = ref();

function contextMenutype(nameNamespace, nameType, event) {
  if (!checkElementType(event.target, "type")) return;
  event.preventDefault();
  event.stopPropagation();
  resetAllMenu();
  typeMousePosition.value = DOMRect.fromRect({
    x: event.clientX,
    y: event.clientY
  });
  typeContextVisible.value = true;
  typeContextName.value = nameType;
  namespaceContextName.value = nameNamespace;
}

async function onTypeContextMenu(key) {
  typeContextVisible.value = false;
  switch (key) {
    case "delete":
      try {
        await ElMessageBox.confirm(
          `确定删除类别 ${namespaceContextName.value}.${typeContextName.value} ?\n此举不可撤销`,
          `删除类别 ${namespaceContextName.value}.${typeContextName.value}`,
          {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning"
          }
        );
        const dataHandle = await global.open.value.handle.getDirectoryHandle('data', {create: true});
        const namespaceHandle = await dataHandle.getDirectoryHandle(namespaceContextName.value);
        await namespaceHandle.removeEntry(typeContextName.value, { recursive: true });
        ElNotification({
          type: 'success',
          message: "删除成功",
          title: `删除类别 ${namespaceContextName.value}.${typeContextName.value} 成功`
        });
        delete (global.data_list.value[namespaceContextName.value] ?? {contents: {}}).contents[typeContextName.value];
      } catch (e) {
        console.error(e);
        if (e instanceof DOMException) {
          let message = "未知错误: " + e;
          switch (e.name) {
            case "NotFoundError":
              message = '该命名空间/类别不存在';
              break;
            case "NotAllowedError":
              message = '系统不允许删除文件';
              break;
          }
          ElNotification({
            type: 'error',
            title: `删除类别 ${namespaceContextName.value}.${typeContextName.value} 失败`,
            message
          });
        }
      }
      break;
  }
}

const folderContextTriggerRef = ref({
  getBoundingClientRect: () => folderMousePosition.value
});

const folderContextVisible = ref(false);
const folderMousePosition = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
});
const folderPath = ref();

function contextMenuFolder(path, uuid, event) {
  if (!checkElementType(event.target, `folder_${uuid}`)) return;
  event.preventDefault();
  event.stopPropagation();
  resetAllMenu();
  folderMousePosition.value = DOMRect.fromRect({
    x: event.clientX,
    y: event.clientY
  });
  folderPath.value = path;
  folderContextVisible.value = true;
}

async function onFolderContextMenu(key) {
  folderContextVisible.value = false;
  switch (key) {
    case "delete":
      try {
        await ElMessageBox.confirm(
          `确定删除文件夹 ${folderPath.value} ?\n此举不可撤销`,
          `删除文件夹`,
          {
            confirmButtonText: "确认",
            cancelButtonText: "取消",
            type: "warning"
          }
        );
        const rootFS = global.open.value.filesystem;
        const folderHandle = await rootFS.$getFolderHandle(folderPath.value, false);
        await folderHandle.remove({recursive: true});
        ElNotification({
          type: 'success',
          message: "删除成功",
          title: `删除文件夹 ${folderPath.value} 成功`
        });
        let root = {contents: global.dirs.value};
        const allPart = folderPath.value.split(sep);
        for (let i = 0; i < allPart.length - 1; i++) {
          console.log(`requiring ${allPart[i]} within ${root.type}`);
          root = root.contents[allPart[i]] ?? {};
          console.log(`new root: ${JSON.stringify(root)}`)
          if (root.type !== 'dir') break;
        }
        if (root.type === 'dir') {
          delete root.contents[allPart.at(-1)];
        }
      } catch (e) {
        console.error(e);
        if (e instanceof DOMException) {
          let message = "未知错误: " + e;
          switch (e.name) {
            case "NotFoundError":
              message = '该文件夹不存在';
              break;
            case "NotAllowedError":
              message = '系统不允许删除文件';
              break;
          }
          ElNotification({
            type: 'error',
            title: `删除文件夹 ${folderPath.value} 失败`,
            message
          });
        }
      }
      break;
  }
}

const renderDynamic = ref();

function debug(t) {
  console.log(t);
  return t;
}

watchEffect(() => document.title = global.open.value?.name ?? "Datapack WYSIWYG Editor");

onMounted(() => {
  document.addEventListener("contextmenu", resetAllMenu);
});

onUnmounted(() => {
  document.removeEventListener("contextmenu", resetAllMenu);
});
</script>

<template>
  <Nav />
  <el-empty v-if="!(global.open.value instanceof Datapack)" description="欢迎使用Datapack WYSIWYG编辑器" />
  <el-splitter v-if="global.open.value instanceof Datapack" style="height: 100%">
    <el-splitter-panel size="16%" min="16%">
      <el-menu mode="vertical" @select="onMenu" ref="mainMenu">
        <el-sub-menu index="basic">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>基础信息</span>
          </template>
          <el-menu-item index="basic.info">模组信息</el-menu-item>
          <el-menu-item index="basic.deps">前置</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="data">
          <template #title>
            <el-icon><SetUp /></el-icon>
            <span>数据</span>
          </template>
          <template v-for="([key, value]) in Object.entries(global.data_list.value).sort((a, b) => a[0].localeCompare(b[0]))">
            <el-sub-menu v-if="value.type === 'dir'" :index="`data:${key}`" @contextmenu="(e) => contextMenuNamespace(key, e)">
              <template #title>
                <span class="sentinal_namespace">{{ key }}</span>
              </template>
              <template v-for="([key2, value2]) in Object.entries(global.data_list.value[key].contents).sort((a, b) => a[0].localeCompare(b[0]))">
                <FolderRecursive sentinal="sentinal_type" :prefix="`data${sep}${key}${sep}${key2}`" :folder="value2" v-if="value2.type === 'dir'" @contextmenu="(e) => contextMenutype(key, key2, e)" :ctxmenu="contextMenuFolder" />
              </template>
              <el-menu-item :index='`data.add-type:${key}`'>
                <el-icon><FolderAdd /></el-icon>添加类别
              </el-menu-item>
            </el-sub-menu>
          </template>
          <el-menu-item index="data.add-namespace">
            <el-icon><FolderAdd /></el-icon>添加命名空间
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-splitter-panel>
    <el-splitter-panel min="66%">
      <basic-info v-if="lastSelect === 'basic.info'" />
      <dependencies v-if="lastSelect === 'basic.deps'" />
      <!--  -->
      <Suspense v-if="lastSelect.startsWith('data-file:') && findMatchPlugin(lastSelect.substring(10))">
        <template #fallback>
          <div style="width: 100%; height: 100%" v-loading="true"></div>
        </template>
        <template #default>
          <component
            :is="findMatchPlugin(lastSelect.substring(10))"
            :promiseSrc="readWithCache(lastSelect.substring(10))"
            @save="(val) => writeToCache(val, lastSelect.substring(10))"
            :key="lastSelect"
          />
        </template>
      </Suspense>

      <el-dialog
        v-model="isCreatingNamespace"
        title="创建命名空间"
        width="50%"
        align-center>
        <el-form :model="creatingNamespaceForm" :rules="namespaceRule" ref="namespaceForm" @submit.prevent="submitNamespace">
          <el-form-item label="命名空间" prop="name" required>
            <el-input v-model="creatingNamespaceForm.name" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="isCreatingNamespace = false">取消</el-button>
          <el-button type="primary" @click="submitNamespace">创建</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="isCreatingType"
        title="创建类别"
        width="50%"
        align-center>
        <el-form :model="creatingTypeForm" :rules="typeRule" ref="typeForm" @submit.prevent="submitType">
          <el-form-item label="类别" prop="name" required>
            <el-input v-model="creatingTypeForm.name">
              <template #prepend>{{ creatingTypeForNamespace + "." }}</template>
            </el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="isCreatingType = false">取消</el-button>
          <el-button type="primary" @click="submitType">创建</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="isCreatingFolder"
        title="创建文件夹"
        width="50%"
        align-center>
        <el-form :model="creatingFolderForm" :rules="folderRule" ref="folderForm" @submit.prevent="submitFolder">
          <el-form-item label="文件夹" prop="name" required>
            <el-input v-model="creatingFolderForm.name">
              <template #prepend>{{ creatingFolderAt + "/" }}</template>
            </el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="isCreatingFolder = false">取消</el-button>
          <el-button type="primary" @click="submitFolder">创建</el-button>
        </template>
      </el-dialog>
    </el-splitter-panel>
  </el-splitter>

  <el-popover
    v-model:visible="namespaceContextVisible"
    placement="bottom-start"
    trigger="click"
    virtual-triggering
    :virtual-ref="contextTriggerRef"
    :show-arrow="false"
  >
    <el-menu
      default-active="empty"
      @select="onNamespaceContextMenu"
      class="ctx"
    >
      <el-divider style="margin: 0"/>
      <el-menu-item index="create_type">
        <span>添加类别</span>
      </el-menu-item>
      <el-divider style="margin: 0"/>
      <el-menu-item index="delete">
        <span style="color: #ff0000">删除命名空间</span>
      </el-menu-item>
      <el-divider style="margin: 0"/>
    </el-menu>
  </el-popover>
  <el-popover
    v-model:visible="typeContextVisible"
    placement="bottom-start"
    trigger="click"
    virtual-triggering
    :virtual-ref="typeContextTriggerRef"
    :show-arrow="false"
  >
    <el-menu
      default-active="empty"
      @select="onTypeContextMenu"
      class="ctx"
    >
      <el-divider style="margin: 0"/>
      <el-menu-item index="delete">
        <span style="color: #ff0000">删除类别</span>
      </el-menu-item>
      <el-divider style="margin: 0"/>
    </el-menu>
  </el-popover>

  <el-popover
    v-model:visible="folderContextVisible"
    placement="bottom-start"
    trigger="click"
    virtual-triggering
    :virtual-ref="folderContextTriggerRef"
    :show-arrow="false"
  >
    <el-menu
      default-active="empty"
      @select="onFolderContextMenu"
      class="ctx"
    >
      <el-divider style="margin: 0"/>
      <el-menu-item index="delete">
        <span style="color: #ff0000">删除类别</span>
      </el-menu-item>
      <el-divider style="margin: 0"/>
    </el-menu>
  </el-popover>
</template>

<style scoped>
.el-menu--vertical[role=menubar] {
  height: 100%;
}

.ctx {
  height: auto !important;
  border-right: 0;

  li {
    line-height: normal;
    height: 2lh;
  }
}
</style>