import Filesystem from './filesystem.js'
import toml from 'smol-toml'

class Datapack {
  /**
   * @member {Filesystem}
   */
  $fs = undefined;
  /**
   * @member {FileSystemDirectoryHandle}
   */
  $handle = undefined;
  $isNew = false;

  constructor(handle) {
    this.$fs = new Filesystem(handle);
    this.$handle = handle;
    this.$isNew = false;
  }

  get isNew() {
    return this.$isNew;
  }

  async init(error) {
    let content;
    let obj;
    try {
      content = await this.$fs.read("META-INF/mods.toml");
      this.$isNew = false;
    } catch (e) {
      try {
        content = await this.$fs.read("META-INF/neoforge.mods.toml");
        this.$isNew = true;
      } catch (e2) {
        error[0] = e;
        return -1;
      }
    }
    try {
      obj = toml.parse(content);
    } catch (e) {
      error[0] = e;
      return -2;
    }

    this.license = obj.license ?? "";
    if (!obj.mods) obj.mods = [];
    this.modId = obj.mods[0]?.modId ?? "";
    this.version = obj.mods[0]?.version ?? "0";
    this.name = obj.mods[0]?.displayName ?? "";
    this.authors = obj.mods[0]?.authors ?? "";
    this.description = obj.mods[0]?.description ?? "";
    this.dependencies = obj?.dependencies ? obj.dependencies[this.modId] : [];

    this.$originalObj = obj;
    return 0;
  }

  get filesystem() {
    return this.$fs;
  }

  get handle() {
    return this.$handle;
  }

  get serialized() {
    this.$originalObj.license = this.license;
    this.$originalObj.mods = [
      {
        modId: this.modId,
        version: this.version,
        displayName: this.name,
        authors: this.authors,
        description: this.description,
      }
    ];
    this.$originalObj.dependencies = {
      [this.modId]: this.dependencies
    };
    return toml.stringify(this.$originalObj);
  }

  async writeDir() {
    const ret = {};
    await this.$writeDirToObj(this.$handle, ret);
    return ret;
  }

  async $writeDirToObj(dirHandle, obj) {
    for await (const [key, value] of dirHandle) {
      if (value.kind === "file") {
        obj[key] = {
          type: "file"
        }
      } else {
        obj[key] = {
          type: "dir",
          contents: {}
        }
        await this.$writeDirToObj(value, obj[key].contents);
      }
    }
  }
}

export default Datapack;