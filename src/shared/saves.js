import global from './global.js'
import { ElNotification } from 'element-plus'

const modified = new Set();

export const testDependencyVersion = /^(?:(?:([^,(\[)\]]+)|\[([^,(\[)\]]+)])|([(\[][^,(\[)\]]+,[^,(\[)\]]+[)\]])|(\(,[^,(\[)\]]+[\)\]])|([\(\[][^,(\[)\]]+,\)))(,(?:(?:([^,(\[)\]]+)|\[([^,(\[)\]]+)])|([(\[][^,(\[)\]]+,[^,(\[)\]]+[)\]])|(\(,[^,(\[)\]]+[)\]])|([(\[][^,(\[)\]]+,\))))*$/;

function isOptional(obj) {
  if (global.open.value.isNew) {
    return obj.type === "optional";
  }
  return !obj.mandatory;
}

function validateMeta() {
  const datapack = global.open.value;
  if (!datapack.modId) return false;
  if (!datapack.version) return false;

  const setCheck = new Set();

  for (const deps of datapack.dependencies) {
    if (!deps.modId) return false;
    if (deps.modId === datapack.modId) return false;
    if (setCheck.has(deps.modId)) return false;
    if (!testDependencyVersion.test(deps.versionRange)) return false;
    if (isOptional(deps) && deps.ordering === "NONE") return false;
    setCheck.add(deps.modId);
  }
  return true;
}

let isSaving = false;

export function makeModified(path) {
  modified.add(path);
}

export async function save() {
  if (isSaving) return;
  isSaving = true;
  try {
    if (validateMeta()) {
      const meta = global.open.value.serialized;
      const writePath = `META-INF/${global.open.value.isNew ? 'neoforge.' : ''}mods.toml`;
      await global.open.value.filesystem.write(writePath, meta);
    } else {
      ElNotification({
        title: "基本资料校验未通过",
        message: "请在左侧菜单选取基础信息 > 模组信息和前置检查是否有错误项",
        type: "error"
      });
    }
  } catch (e) {
    ElNotification({
      title: "未知错误",
      message: e.toString(),
      type: "error"
    });
  }
  isSaving = false;
}