import assert from "node:assert/strict";

// Unit fixture for public hook state/effects, not a DOM or browser renderer.
// SSR assertions use real React. Focus, native events and layout require a browser.
export function createHookFixture(hook, input, globalKey) {
  const slots = [], pendingEffects = [], lateUpdates = [];
  let cursor = 0, dirty = true, stopped = false, result;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (value) => {
        if (stopped) { lateUpdates.push(index); return; }
        slots[index].value = typeof value === "function" ? value(slots[index].value) : value; dirty = true;
      }];
    },
    useRef(value) { const index = cursor++; slots[index] ??= { current: value }; return slots[index]; },
    useEffect(effect, deps) {
      const index = cursor++, old = slots[index];
      if (!old || deps.some((value, position) => !Object.is(value, old.deps[position]))) {
        slots[index] = { deps, cleanup: old?.cleanup };
        pendingEffects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  function render() {
    globalThis[globalKey] = hooks; cursor = 0; dirty = false;
    result = hook(input);
    while (pendingEffects.length) pendingEffects.shift()();
  }
  render();
  return {
    get value() { return result; },
    lateUpdates,
    update(changes) { input = { ...input, ...changes }; dirty = true; },
    async settle() {
      for (let count = 0; count < 30; count++) {
        if (dirty) render();
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty) return result;
      }
      assert.fail("hook fixture did not settle");
    },
    stop() { slots.forEach((slot) => slot?.cleanup?.()); stopped = true; delete globalThis[globalKey]; },
  };
}
