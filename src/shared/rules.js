const RegExps = {
  ResourceLocation: /^[\da-z_\-.]+:[\da-z_\-.\/]+$/,
}

const Default = {};
for (const [key, value] of Object.entries(RegExps)) {
  Default[key] = (errorMsg) => ((rule, valueI, callback) => callback(valueI.match(value) ? undefined : new Error(errorMsg)));
}

Object.freeze(RegExps);
Object.freeze(Default);

const grab = { RegExps, Default };

window.Validators = grab;
Object.freeze(window.Validators);

export { RegExps, Default };
export default grab;