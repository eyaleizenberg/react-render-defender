'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = logAllUpdates;
var comparePropsAndState = function comparePropsAndState(component, prevProps, prevState) {

  var getCustomSettings = function getCustomSettings() {
    var customSettings = {};
    try {
      customSettings = require(process.env.ROOT + '/rdefender.json');
    } catch (err) {}
    return customSettings;
  };

  var customSettings = getCustomSettings();
  var propChanges = [];
  var stateChanges = [];

  for (var key in prevProps) {
    if (component.props[key] !== prevProps[key]) propChanges.push(key);
  }

  for (var _key in prevState) {
    if (component.state[_key] !== prevState[_key]) stateChanges.push(_key);
  }

  return { propChanges: propChanges, stateChanges: stateChanges };
};

function logAllUpdates() {
  return function wrap(ReactClass) {
    var originalComponentDidMount = ReactClass.prototype.componentDidMount;
    var originalComponentDidUpdate = ReactClass.prototype.componentDidUpdate;

    ReactClass.prototype.componentDidMount = function componentDidMount() {
      this.previousRenderTimeStamp = new Date();
      if (originalComponentDidMount) {
        return originalComponentDidMount.apply(this, arguments);
      }
    };

    ReactClass.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      var newRenderTimeStamp = new Date();
      var timeRenderDiff = newRenderTimeStamp - this.previousRenderTimeStamp;
      var threshold = settings[this.constructor.name] || 200;

      if (!settings.quiet_mode) {
        if (timeRenderDiff < threshold) {
          var diff = comparePropsAndState(this, prevProps, prevState);
          console.groupCollapsed('The component ' + this.constructor.name + ' rendered twice in less than ' + threshold + 'ms!');
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
    };

    return ReactClass;
  };
}