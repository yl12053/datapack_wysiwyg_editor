import { normalize, sep } from 'path-browserify';

class Filesystem {
  /**
   * @member {FileSystemDirectoryHandle}
   */
  $handle = undefined;

  /**
   * @constructor
   * @param {FileSystemDirectoryHandle} handle
   */
  constructor(handle) {
    this.$handle = handle;
  }

  async remove(dir) {
    const normalized = normalize(dir);
    let handle = this.$handle;
    const splitted = normalized.split(sep);
    for (let part of splitted.slice(0, -1)) {
      handle = await handle.getDirectoryHandle(part);
    }
    await handle.removeEntry(splitted.at(-1));
  }

  async readdir(dir) {
    const handle = await this.$getFolderHandle(dir);
    return await Array.fromAsync(handle.keys())
  }

  async $getFileHandle(dir) {
    const normalized = normalize(dir);
    let handle = this.$handle;
    const splitted = normalized.split(sep);
    for (let part of splitted.slice(0, -1)) {
      handle = await handle.getDirectoryHandle(part);
    }
    return await handle.getFileHandle(splitted.at(-1));
  }

  async $getFolderHandle(dir, create) {
    const normalized = normalize(dir);
    let handle = this.$handle;
    if (normalized === ".") return handle;
    const splitted = normalized.split(sep);
    for (let part of splitted) {
      handle = await handle.getDirectoryHandle(part, {create: create || false});
    }
    return handle;
  }

  async read(dir) {
    const file = await (await this.$getFileHandle(dir)).getFile();
    const url = URL.createObjectURL(file);
    const val = await (await fetch(url)).text();
    URL.revokeObjectURL(url);
    return val;
  }

  async getRawBlob(dir) {
    return await (await this.$getFileHandle(dir)).getFile();
  }

  /**
   *
   * @param {string} dir
   * @param {ArrayBuffer|DataView|Blob|string} data
   * @returns {Promise<void>}
   */
  async write(dir, data) {
    const handle = await this.$getFileHandle(dir);
    const writable = await handle.createWritable();
    await writable.seek(0);
    await writable.write({ type: "write", data, position: 0 });
    await writable.close();
  }
}

export default Filesystem;