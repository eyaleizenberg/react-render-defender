const getCustomSettings = () => {
  let opts = {} ;
  try {
    return opts = require(process.env.ROOT+'/rdefender.json');
  } catch(err) {}
  return opts;
}

const customSettings = getCustomSettings();

const comparePropsAndState = (component, prevProps, prevState) => {
  const propChanges = [];
  const stateChanges = [];

  for (let key in prevProps) {
    if (component.props[key] !== prevProps[key]) propChanges.push(key)
  }

  for (let key in prevState) {
    if (component.state[key] !== prevState[key]) stateChanges.push(key)
  }

  return { propChanges, stateChanges };
}

export default function logAllUpdates() {
  return function wrap(ReactClass) {
    const originalComponentDidMount = ReactClass.prototype.componentDidMount;
    const originalComponentDidUpdate = ReactClass.prototype.componentDidUpdate;

    ReactClass.prototype.componentDidMount = function componentDidMount() {
      this.previousRenderTimeStamp = new Date();
      if (originalComponentDidMount) {
        return originalComponentDidMount.apply(this, arguments);
      }
    }

    ReactClass.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      const newRenderTimeStamp = new Date();
      const timeRenderDiff = newRenderTimeStamp - this.previousRenderTimeStamp;
      const threshold = customSettings[this.constructor.name] || 200

      if(!customSettings.quiet_mode) {
        if (timeRenderDiff < threshold) {
          const diff = comparePropsAndState(this, prevProps, prevState);
          console.groupCollapsed(`The component ${this.constructor.name} rendered twice in less than ${threshold}ms!`);
          console.info('Time between renders:', timeRenderDiff);
          console.info('Props key changes:', diff.propChanges);
          console.info('State key changes:', diff.stateChanges);
          console.groupEnd();
        }
      }

      this.previousRenderTimeStamp = newRenderTimeStamp;

      if (originalComponentDidUpdate) {
        return originalComponentDidUpdate.apply(this, arguments);
      }
    }

    return ReactClass;
  }
}
