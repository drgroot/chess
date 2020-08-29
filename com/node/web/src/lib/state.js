/**
 * State Variable
 * @typedef {Object} StateVariable
 * @property {string} name name of the attribute
 * @property {any} value value of the addribute
 * @property {function} [comparitor] function to compare if state has changed. should return
 *  true if the state has changed.
 */

export const simpleCompare = (a, b) => a !== b;

export const arrayCompare = (a, b) => {
  if (a.length !== b.length) return true;

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return true;
    }
  }

  return false;
};

export default class State {
  /**
   * @param {StateVariable[]} variables
   */
  constructor(variables) {
    this.stateVariables = variables
      .map((v) => ({
        comparitor: (v.value.constructor === Array) ? arrayCompare : simpleCompare,
        ...v,
      }));

    this.state = this.stateVariables
      .reduce(
        (s, { name, value }) => ({ ...s, [name]: value }),
        {},
      );

    this.stateComparitors = this.stateVariables
      .reduce(
        (s, { name, comparitor }) => ({ ...s, [name]: comparitor }),
        {},
      );

    this.stateListeners = this.stateVariables
      .reduce(
        (s, { name }) => ({ ...s, [name]: [] }),
        {},
      );
  }

  setState(newState) {
    const oldState = { ...this.state };
    const updateEvents = new Set();

    for (const [name, value] of Object.entries(newState)) {
      if (oldState[name] && this.stateComparitors[name](oldState[name], value)) {
        this.state[name] = value;

        for (const listener of this.stateListeners[name]) {
          if (!updateEvents.has(listener)) {
            updateEvents.add(listener);
          }
        }
      }
    }

    // call out listeners
    for (const listener of [...updateEvents].sort((a, b) => a.priority - b.priority)) {
      listener.function(oldState, this.state);
    }
  }

  /**
   * @param {string} name
   * @param {function} fun the subscribtion function called
   */
  subscribe(name, fun) {
    if (this.stateListeners[name]) {
      let entry = { priority: 0, function: fun };

      // check if same function has been used before
      for (const [key, listeners] of Object.entries(this.stateListeners)) {
        const listener = listeners.find((l) => l.function === fun);
        if (listener) {
          if (key === name) return;
          entry = listener;
        }
      }

      // append to listener registry
      if (this.stateListeners[name].length > entry.priority) {
        entry.priority = this.stateListeners.length;
      }
      this.stateListeners[name].push(entry);
    }
  }
}
