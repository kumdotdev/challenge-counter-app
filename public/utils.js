export const loadState = (name) => {
  try {
    const serializedState = localStorage.getItem(name);
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (error) {
    return undefined;
  }
};

export const saveState = (name, state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(name, serializedState);
  } catch (error) {
    console.log(error);
  }
};

export const debounce = (fn, wait) => {
  let timer;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      console.log('debounced after: ', wait);
    }, wait);
  };
};

export function throttle(fn, threshold, scope) {
  threshold || (threshold = 250);
  var last, deferTimer;

  return function () {
    var context = scope || this;
    var now = +new Date(),
      args = arguments;

    if (last && now < last + threshold) {
      // Hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

export const dayShort = (date = Date.now()) =>
  new Date(date).toISOString().substring(0, 10);

export const niceDate = (date) =>
  new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export const toISODateShort = (string) =>
  new Date(string).toISOString().slice(0, 10);

export const groupByDate = (objectArray, dateProperty) =>
  objectArray.reduce(function (acc, obj) {
    var key = toISODateShort(obj[dateProperty]);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
