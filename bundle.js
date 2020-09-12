(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');

},{}],2:[function(require,module,exports){
class Cursor {
    constructor() {
        this.seq = 0;
        this.track = 0;
        this.bar = 0;
        this.step = 0;
        this.octave = 4; // http://computermusicresource.com/midikeys.html
        this.len = 1;
        this.velocity = 96;
        this.view = null;
    }

    left() {
        if (this.step > 0) {
            this.step--;
        } else if (this.bar > 0) {
            this.bar--;
            this.step = 15;
        }
    }

    octaveUp() {
        this.octave = Math.min(this.octave + 1, 11);
    }

    octaveDown() {
        this.octave = Math.max(0, this.octave - 1);
    }

    right() {
        if (this.step < 15) {
            this.step++;
        } else {
            this.bar++;
            this.step = 0;
        }
    }

    up() {
        if (this.track > 0) {
            this.track--;
        }
    }

    down() {
        if (this.track < 63) {
            this.track++;
        }
    }

    home() {
        if (this.step > 0) {
            this.step = 0;
        } else if (this.bar > 0) {
            this.bar--;
        }
    }

    end() {
        if (this.step < 15) {
            this.step = 15;
        } else {
            this.bar++;
        }
    }

    inc(sequence) {
        let { time } = this;
        for (let event of sequence.events.filter((e) => e.seq === this.seq && e.track === this.track && e.time === time)) {
            if (event.len < 16) {
                event.len++;
            }
        }
    }

    dec(sequence) {
        let { time } = this;
        for (let event of sequence.events.filter((e) => e.seq === this.seq && e.track === this.track && e.time === time)) {
            if (event.len > 1) {
                event.len--;
            }
        }
    }

    get time() {
        return this.bar * 16 + this.step;
    }
}

module.exports = Cursor;
},{}],3:[function(require,module,exports){
const Binding = require('./ui/binding');
const Body = require('./ui/body');
const Button = require('./ui/button');
const Label = require('./ui/label');
const ListView = require('./ui/list-view');
const Message = require('./message');
const Model = require('./model');
const Popup = require('./ui/popup');
const Row = require('./ui/row');
const SVG = require('./ui/svg');
const TabbedView = require('./ui/tabbed-view');
const Column = require('./ui/column');
const View = require('./ui/view');

window.onload = () => {
    let model = new Model();
    let body = new Body(
        new Row(
            new Label('SONG'),
            new Label('TEMPO'),
            new Label('TRACK'),
            new Label('SEQ'),
            new Label('BAR'),
            new Label('STEPS'),
        ),
        new Row(
            new Button('1', 'value').on('tap', () => body.element.requestFullscreen()),
            new Button('120', 'value').on('tap', () => null),
            new Button(new Binding(model.cursor, 'track', (val) => 1 + val), 'value').on('tap', () => {
                body.tabbedViews[0].selectedIndex = 1;
            }),
            new Button(new Binding(model.cursor, 'seq', (val) => 1 + val), 'value').on('tap', () => null),
            new Button(new Binding(model.cursor, 'bar', (val) => 1 + val), 'value').on('tap', () => null),
            new Button('Notes', 'value').on('tap', () => {
                body.tabbedViews[0].selectedIndex = 0;
            }),
        ),
        new Label('TRACK'),
        new Row().on('reload', (event) => {
            let { view } = event.detail;
            view.clear();
            for (let i = 0; i < 16; i++) {
                view.append(new Button(1 + i, 'value').on('tap', () => model.cursor.track = i));
            }
        }).on('update', (event) => {
            let { view } = event.detail;
            for (let i = 0; i < 16; i++) {
                view.buttons[i].select(model.cursor.track === i);
            }
        }),
        new TabbedView(
            new Column(
                new Row(
                    new Label('LEN', 5),
                    new Label('VEL', 1),
                    new Label('OCTAVE', 5),
                    new Label('INPUT', 2),
                ),
                new Row(
                    new NoteLenPicker(model, '&#119133;', 16),
                    new NoteLenPicker(model, '&#119134;', 8),
                    new NoteLenPicker(model, '&#119135;', 4),
                    new NoteLenPicker(model, '&#119136;', 2),
                    new NoteLenPicker(model, '&#119137;', 1),

                    new Button(new Binding(model, 'velocity', Binding.number), 'value').on('tap', () => model.nextVelocity()),
                    new Button('-', 'value').on('tap', () => model.cursor.octaveDown()),
                    new OctavePicker(model),
                    new Button('+', 'value').on('tap', () => model.cursor.octaveUp()),
                    new Button('Tie', 'value'),
                    new Button('Rest', 'value'),
                ),
                new PianoKeyboard(model),
                new Row(
                    new Label('STEPS'),
                ),
                new Sequencer(model),
            ),
            new TrackListView(),
        ),
        new Row(
            new Column(
                new Button('<div class="button-label">COPY</div>', 'no-style').on('tap', () => model.copy()),
                new Button('<div class="button-label">PASTE</div>', 'no-style').on('tap', () => model.paste()),
            ).flex(1),
            new Button('<div class="button-label">CLEAR</div>', 'no-style').on('tap', () => model.clear()).flex(1),
            new Column(
                new Row(
                    new Button('|<', 'small').on('tap', () => model.rewind()),
                    new Button('<<', 'small').on('tap', () => model.bwd()),
                    new Button('>>', 'small').on('tap', () => model.fwd()),
                ),
                new Row(
                    new Button('REC').on('tap', () => model.rec()),
                    new Button('PLAY').on('tap', () => model.togglePlay()).on('update', (event) => {
                        let { view } = event.detail;
                        view.select(model.player.playing);
                    }).flex(2),
                ),
            ).flex(3),
        )
    );
    model.player.onchange = () => {
        body.update();
    };
    model.load().then(() => {
        body.reload();
        body.update();
    });
    window.body = body;
    window.model = model;
};

class PianoKeyboard extends SVG {
    constructor(model) {
        super();
        this.model = model;
        this.element.setAttribute('viewBox', '0 0 630 60');
        this.keys = {};
        this.marks = {};
        this.group = 'pianoKeyboards';

        // white keys
        for (let i = 0; i < 3 * 7; i++) {
            let n = Math.floor(i / 7) * 12 + (i % 7) * 2;
            if (i % 7 > 2) n--;
            if (i % 7 > 6) n--;
            let key = this.keys[n] = this.rect(i * 30, 0, 29, 60, 'fill: whitesmoke;');
            key.on('mousedown', () => key.element.style.fill = 'gray');
            key.on('mouseup mouseout', () => key.element.style.fill = 'whitesmoke');
            key.on('tap', () => this.toggle(n));
            key.on('press pressup', (event) => this.preview(n, event.type === 'pressup'));
            this.marks[n] = this.circle(i * 30 + 15, 50, 4, 'fill: gray; display: none; pointer-events: none;');
        }

        // black keys
        for (let i = 0; i < 3 * 7; i++) {
            if (i % 7 !== 2 && i % 7 !== 6) {
                let n = Math.floor(i / 7) * 12 + (i % 7) * 2 + 1;
                if (i % 7 > 2) n--;
                if (i % 7 > 6) n--;
                let key = this.rect(i * 30 + 20, 0, 20, 35, 'fill: black;');
                key.on('mousedown', () => key.element.style.fill = 'gray');
                key.on('mouseup mouseout', () => key.element.style.fill = 'black');
                key.on('tap', () => this.toggle(n));
                key.on('press pressup', (event) => this.preview(n, event.type === 'pressup'));
                this.marks[n] = this.circle(i * 30 + 30, 25, 4, 'fill: gray; display: none; pointer-events: none;');
            }
        }
    }

    toggle(note) {
        let { sequence, cursor } = this.model;
        let { seq, track, time, octave, velocity, len } = cursor;
        note += octave * 12;
        sequence.toggle(seq, track, time, note, velocity, len);
    }

    preview(note, off = false) {
        let { cursor, player } = this.model;
        let { octave, velocity } = cursor;
        note += octave * 12;
        if (!off) {
            player.send(Message.noteOn(0, note, velocity), true);
        } else {
            player.send(Message.noteOff(0, note), true);
        }
    }

    mark(note, marked) {
        this.marks[note].element.style.display = marked ? 'initial' : 'none';
    }

    update() {
        let { sequence, cursor } = this.model;
        let { seq, track, time, octave } = cursor;
        let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
        for (let i = 0; i < 3 * 12; i++) {
            let note = octave * 12 + i;
            this.mark(i, events.find((e) => e.note === note));
        }
        super.update();
    }
}

class OctavePicker extends SVG {
    constructor(model) {
        super();
        this.element.style.flex = 3;
        this.element.setAttribute('viewBox', '0 0 150 30');
        this.marks = {};
        this.group = 'octavePickers';
        this.model = model;

        for (let i = 0; i < 5; i++) {
            let frame = this.rect(i * 30, 0, 30, 30, 'fill: transparent;')
            frame.on('tap', () => this.model.cursor.octave = -2 + i * 3);
            this.marks[i] = this.circle(30 * i + 15, 15, 4, 'fill: white; stroke: gray; stroke-width: 1; pointer-events: none;');
        }
    }

    fill(i, color) {
        if (this.marks[i]) this.marks[i].element.style.fill = color;
    }

    update() {
        for (let i = 0; i < 5; i++) {
            let { sequence, cursor } = this.model;
            let { seq, track, time } = cursor;
            let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time && e.note >= (-2 + i * 3) * 12 && e.note < (-2 + i * 3 + 1) * 12);
            this.fill(i, -2 + i * 3 == cursor.octave ? 'gray' : events.length ? 'lightgray' : 'white');
        }
        super.update();
    }
}

class Sequencer extends SVG {
    constructor(model) {
        super();
        this.stepCount = 16;
        this.element.setAttribute('viewBox', `0 0 ${this.stepCount * 30} 60`);
        this.steps = {};
        this.marks = {};
        this.fills = {};
        this.beats = {};
        this.group = 'stepSequencers';
        this.model = model

        for (let i = 0; i < this.stepCount; i++) {
            let step = this.steps[i] = this.rect(i * 30, 10, 29, 60, 'fill: whitesmoke');
            step.on('mousedown', () => step.element.style.fill = 'gray');
            step.on('mouseup mouseout', () => step.element.style.fill = 'whitesmoke');
            step.on('tap', () => {
                this.model.cursor.step = i;
                let { len, velocity } = this.model;
                if (len) {
                    this.model.cursor.len = len;
                }
                if (velocity) {
                    this.model.cursor.velocity = velocity;
                }
            });
            step.on('press pressup', (event) => {
                let { type } = event;
                this.model.cursor.step = i;
                let { events } = this.model;
                for (let event of events) {
                    if (type === 'press') {
                        this.model.player.send(Message.noteOn(0, event.note, event.velocity), true);
                    } else {
                        this.model.player.send(Message.noteOff(0, event.note), true);
                    }
                }
            });
            this.marks[i] = this.circle(i * 30 + 15, 50, 4, 'fill: gray; display: none;');
        }
        for (let i = 0; i < this.stepCount; i += 4) {
            this.rect(i * 30, 0, 4 * 30 - 1, 9, 'fill: whitesmoke;');
            this.beats[i] = this.text(i * 30 + 2 * 30, 5, 'fill: gray; font-size: 8px; dominant-baseline: middle; pointer-events: none; user-select: none;');
        }
    }

    fill(i, color) {
        this.steps[i].element.style.fill = color;
        this.fills[i] = color;
    }

    mark(i, display) {
        this.marks[i].element.style.display = display;
    }

    update() {
        let { seq, track, bar, step } = this.model.cursor;
        for (let i = 0; i < this.stepCount; i++) {
            let events = this.model.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === bar * 16 + i);
            this.fill(i, i === step ? 'deepskyblue' : 'whitesmoke');
            this.mark(i, events.length > 0 ? 'initial' : 'none');
        }
        for (let i = 0; i < this.stepCount; i += 4) {
            let step = model.cursor.bar * 16 + i;
            let bar = 1 + Math.floor(step / 16);
            let beat = 1 + Math.floor((step % 16) / 4);
            this.beats[i].innerHTML = `${bar}.${beat}`;
        }
        super.update();
    }
}

class NoteLenPicker extends Button {
    constructor(model, label, value) {
        super(label, 'value');
        this.model = model;
        this.value = value;
        this.on('tap', () => {
            this.model.len = this.value;
        });
    }

    update() {
        super.update();
        this.model && this.select(this.model.len === this.value);
    }
}

class TrackListView extends Row {
    constructor() {
        super();
        for (let j = 0; j < 2; j++) {
            let col = new Column(new Row(
                new Label('TR').flex(1),
                new Label('PORT').flex(6),
                new Label('CH').flex(1),
                new Label('M').flex(1),
            )).flex(1);
            for (let i = 0; i < 8; i++) {
                let track = j * 8 + i;
                col.append(new Row(
                    new Button(1 + track, 'list-item').flex(1).on('tap', () => {
                        model.cursor.track = track;
                    }),
                    new Button('', 'list-item').flex(6).on('tap', () => {
                        body.present(new Popup(new ListView().on('reload', (event) => {
                            let { view } = event.detail;
                            view.items = Array.from(model.midi.outputs.values()).map((p) => { return { label: p.name, item: p.id } }).concat([{ label: '(NONE)', item: null }]);
                        }).on('select', (event) => {
                            let port = model.midi.outputs.get(event.detail.item);
                            if (port) {
                                model.trackList.assign(track, port.name);
                                model.player.output = port;
                                model.cursor.track = track;
                            } else {
                                model.trackList.assign(track, null);
                                model.player.output = null;
                                model.cursor.track = track;
                            }
                            body.dismiss();
                        })));
                    }),
                    new Button('', 'list-item').flex(1),
                    new Button('OFF', 'list-item').flex(1).on('tap', () => {
                        model.trackList.tracks[track].muted = !model.trackList.tracks[track].muted;
                    }),
                ));
            }
            this.append(col);
        }
    }

    update() {
        super.update();
        let i = 0;
        for (let col of this.columns) {
            for (let row of col.rows) {
                if (row.buttons) {
                    let { port, channel, muted } = model.trackList.tracks[i];
                    row.buttons[0].select(model.cursor.track === i);
                    row.buttons[1].element.innerHTML = port === null ? '' : port;
                    row.buttons[2].element.innerHTML = channel === null ? '' : 1 + channel;
                    row.buttons[3].element.innerHTML = muted ? 'ON' : 'OFF';
                    i++;
                }
            }
        }
    }
}
},{"./message":4,"./model":5,"./ui/binding":9,"./ui/body":10,"./ui/button":11,"./ui/column":12,"./ui/label":13,"./ui/list-view":14,"./ui/popup":15,"./ui/row":16,"./ui/svg":17,"./ui/tabbed-view":18,"./ui/view":20}],4:[function(require,module,exports){
class Message {
    constructor(data) {
        this.data = Array.from(data);
        this.isRealTime = data.length > 0 && (data[0] & 0xf8) == 0xf8;
        if (data.length) {
            switch (data[0] & 0xf0) {
                case 0x80:
                    this.status = 'noteOff';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.velocity = data[2] & 0x7f
                    break;
                case 0x90:
                    this.status = 'noteOn';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.velocity = data[2] & 0x7f
                    if (this.velocity == 0) {
                        this.status = 'noteOff';
                    }
                    break;
                case 0xa0:
                    this.status = 'polyphonicAftertouch';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.value = data[2] & 0x7f
                    break;
                case 0xb0:
                    this.status = 'controlChange';
                    this.channel = data[0] & 0x0f
                    this.controller = data[1] & 0x7f
                    this.value = data[2] & 0x7f
                    break;
                case 0xc0:
                    this.status = 'programChange';
                    this.channel = data[0] & 0x0f
                    this.program = data[1] & 0x0f
                    break;
                case 0xd0:
                    this.status = 'channelAftertouch';
                    this.channel = data[0] & 0x0f
                    this.value = data[1] & 0x0f
                    break;
                case 0xe0:
                    this.status = 'pitchBend';
                    this.channel = data[0] & 0x0f
                    this.value = data[1] & 0x0f | (data[2] & 0x0f << 7)
                    break;
                case 0xf0:
                    switch (data[0]) {
                        case 0xf8:
                            this.status = 'clock';
                            break;
                        case 0xfa:
                            this.status = 'start';
                            break;
                        case 0xfb:
                            this.status = 'continue';
                            break;
                        case 0xfc:
                            this.status = 'stop';
                            break;
                        case 0xff:
                            this.status = 'systemReset';
                            break;
                    }
                    break;
            }
        }
    }

    static noteOn(ch, note, velocity = 100) {
        return new Message([0x90 | (ch & 0x0f), note, velocity]);
    }

    static noteOff(ch, note) {
        return new Message([0x80 | (ch & 0x0f), note, 0x00]);
    }

    static clock() {
        return new Message([0xf8]);
    }

    static start() {
        return new Message([0xfa]);
    }

    static stop() {
        return new Message([0xfc]);
    }
}

module.exports = Message;
},{}],5:[function(require,module,exports){
const Cursor = require('./cursor');
const Player = require('./player');
const Sequence = require('./sequence');
const TrackList = require('./track-list');

class Model {
    constructor() {
        this.sequence = new Sequence('midigator-seq-000.json');
        this.cursor = new Cursor();
        this.player = new Player(this);
        this.poly = false;
        this.trackList = new TrackList();
        this.noteOn = [];
    }

    async load() {
        this.midi = await navigator.requestMIDIAccess({ sysex: false });
        this.sequence.load();
    }

    bwd() {
        if (this.cursor.bar > 0) {
            this.cursor.bar--;
        }
    }

    fwd() {
        this.cursor.bar++;
    }

    rewind() {
        this.cursor.bar = 0;
        this.cursor.step = 0;
    }

    togglePlay() {
        if (this.player.playing) {
            this.player.stop();
        } else {
            this.player.time = this.cursor.bar * 16;
            this.player.continue();
        }
    }

    rec() {

    }

    nextVelocity() {
        let { velocity } = this;
        if (velocity === 127) {
            velocity = 16;
        } else {
            velocity = Math.min(Math.max(16, velocity + 16), 127);
        }
        this.velocity = velocity;
    }

    set len(val) {
        this.events.forEach((e) => e.len = val);
        this.cursor.len = val;
    }

    get len() {
        let len = this.events.map((e) => e.len)[0];
        return len || this.cursor.len;
    }

    set velocity(val) {
        this.events.forEach((e) => e.velocity = val);
        this.cursor.velocity = val;
    }

    get velocity() {
        let velocity = this.events.map((e) => e.velocity)[0];
        return velocity || this.cursor.velocity;
    }

    get events() {
        let { seq, track, time } = this.cursor;
        return this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
    }

    copy() {
        this.clipboard = this.events.map((e) => Object.assign({}, e));
    }

    paste() {
        if (this.clipboard) {
            this.clipboard.forEach((e) => this.sequence.push(e.seq, e.track, this.cursor.time, e.note, e.velocity, e.len));
        }
    }

    clear() {
        let { seq, track, time } = this.cursor;
        this.sequence.delete(seq, track, time);
    }
}

module.exports = Model;
},{"./cursor":2,"./player":6,"./sequence":7,"./track-list":8}],6:[function(require,module,exports){
const Message = require('./message');

class Player {
    constructor(model) {
        this.model = model;
        this.playing = false;
        this.tick = 0;
        this.tempo = 120;
        this.ppq = 24;
        this.output = null;
        this.inflight = [];
        setInterval(() => this.ontick(), 60000 / (this.tempo * this.ppq));
    }

    start() {
        this.stop();
        this.tick = 0;
        this.playing = true;
        this.onchange && this.onchange();
    }

    stop() {
        for (let event of this.inflight) {
            this.output.send(Message.noteOff(event.track, event.note).data);
        }
        this.inflight = [];
        this.playing = false;
        this.onchange && this.onchange();
    }

    continue() {
        this.stop();
        this.playing = true;
        this.onchange && this.onchange();
    }

    ontick() {
        if (!this.playing || !this.output) {
            return;
        }
        let { sequence, cursor } = this.model;
        let time = this.tick * 4 / this.ppq;
        for (let event of sequence.events.filter((e) => e.seq === cursor.seq && (e.time === time || e.time + e.len === time))) {
            if (event.time === time) {
                this.send(Message.noteOn(event.track, event.note, event.velocity));
                this.inflight.push({ track: event.track, note: event.note });
            } else if (event.time + event.len === time) {
                this.send(Message.noteOff(event.track, event.note));
                let index = this.inflight.findIndex((e) => e.track === event.track && e.note === event.note);
                if (index >= 0) {
                    this.inflight.splice(index, 1);
                }
            }
        }
        if (time === sequence.endOfTrack(cursor.seq)) {
            this.stop();
        } else {
            this.tick++;
        }
        this.onchange && this.onchange();
    }

    send(message, preview = false) {
        let data = Array.from(message.data);
        if (preview && (message.status === 'noteOn' || message.status === 'noteOff')) {
            data[0] = (data[0] & 0xf0) | (this.model.cursor.track & 0x0f);
        }
        this.output && this.output.send(data);
    }

    get time() {
        return this.tick * 4 / this.ppq;
    }

    set time(time) {
        this.tick = time * this.ppq / 4;
    }
}

module.exports = Player;
},{"./message":4}],7:[function(require,module,exports){
// const fs = require('fs');

class Sequence {
    constructor(filename) {
        this.events = [];
        this.filename = filename;
    }

    async load() {
        // return new Promise((resolve, reject) => {
        //     fs.readFile(this.filename, 'utf-8', (err, data) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             this.events = JSON.parse(data);
        //             resolve();
        //         }
        //     });
        // });
    }

    save() {
        // let data = JSON.stringify(this.events);
        // fs.writeFile(this.filename, data, (err) => {
        //     if (err) {
        //         console.error(err);
        //     }
        // });
    }

    push(seq, track, time, note, velocity, len) {
        let event = { seq, track, time, note, velocity, len };
        let index = this.events.findIndex((e) => e.seq === seq && e.track === track && e.time === time && e.note === note);
        if (index > -1) {
            this.events.splice(index, 1, event);
        } else {
            this.events.push(event);
        }
        this.save();
        return event;
    }

    delete(seq, track, time) {
        this.events = this.events.filter((e) => e.seq !== seq || e.track !== track || e.time !== time);
        this.save();
    }

    toggle(seq, track, time, note, velocity, len) {
        if (note < 0 || note > 127) {
            return;
        }
        let i = this.events.findIndex((e) => e.seq === seq && e.track === track && e.time === time && e.note === note);
        if (i > -1) {
            this.events.splice(i, 1);
        } else {
            this.events.push({ seq, track, time, note, velocity, len });
        }
        this.save();
    }

    endOfTrack(seq) {
        return Math.ceil(Math.max(0, ...this.events.filter((e) => e.seq === seq).map((e) => e.time + e.len)) / 16) * 16;
    }
}

module.exports = Sequence;
},{}],8:[function(require,module,exports){
class TrackList {
    constructor() {
        this.tracks = [];
        for (let i = 0; i < 16; i++) {
            this.tracks.push({ track: 0, port: null, channel: null, muted: false });
        }
    }

    assign(track, port) {
        if (port) {
            let ch = Math.min(Math.max(0, ...this.tracks.filter((t) => t.port === port).map((t) => t.channel + 1)), 15);
            this.tracks[track].port = port;
            if (this.tracks[track].channel === null) {
                this.tracks[track].channel = ch;
            }
        } else {
            this.tracks[track].port = null;
            this.tracks[track].channel = null;
        }
    }
}

module.exports = TrackList;
},{}],9:[function(require,module,exports){
class Binding {
    constructor(obj, key, transform) {
        this.obj = obj;
        this.key = key;
        this.transform = transform;
    }

    get() {
        let val = this.obj[this.key]
        return this.transform ? this.transform(val) : val;
    }

    static number(val) {
        return Number.isFinite(val) ? val : '-';
    }
}

module.exports = Binding;
},{}],10:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Body extends ViewGroup {
    constructor(...views) {
        super(document.body, ...views);
        this.element.style.backgroundColor = 'white';
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.onmousedown = (event) => {
            if (event.target === this.overlay) {
                this.dismiss();
            }
        }
    }

    present(popup) {
        popup.reload();
        this.popup && this.popup.element.remove();
        this.overlay.append(popup.element);
        this.element.append(this.overlay);
        this.popup = popup;
    }

    dismiss() {
        this.overlay.remove();
        this.popup && this.popup.element.remove();
        delete this.popup;
        this.update();
    }
}

module.exports = Body;
},{"./view-group":19}],11:[function(require,module,exports){
const View = require('./view');

class Button extends View {
    constructor(label = '', className = null) {
        super(document.createElement('div'));
        this.element.style.flex = 1;
        this.element.classList.add('button');
        if (className) {
            this.element.classList.add(className);
        }
        this.on('mousedown', () => this.element.classList.toggle('active', true));
        this.on('mouseup mouseout', () => this.element.classList.toggle('active', this.selected));
        this.group = 'buttons';
        this.label = label;
        this.selected = false;
        this.update();
    }

    update() {
        super.update();
        this.element.innerHTML = (this.label && this.label.get) ? this.label.get() : this.label;
    }

    select(on) {
        this.element.classList.toggle('active', on);
        this.selected = on;
    }
}

module.exports = Button;
},{"./view":20}],12:[function(require,module,exports){
const ViewGroup = require("./view-group");

class Column extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('column');
        this.group = 'columns';
    }
}

module.exports = Column;
},{"./view-group":19}],13:[function(require,module,exports){
const View = require('./view');

class Label extends View {
    constructor(text, span = 1) {
        super(document.createElement('div'));
        this.element.style.flex = 1;
        this.element.innerHTML = text;
        this.element.className = 'label';
        this.element.style.flex = span;
    }
}

module.exports = Label;
},{"./view":20}],14:[function(require,module,exports){
const Column = require('./column');
const Button = require('./button');

class ListView extends Column {
    set items(items) {
        this.clear();
        for (let { label, item } of items) {
            let button = new Button(label, 'value').on('tap', (event) => {
                this.element.dispatchEvent(new CustomEvent('select', { detail: { view: this, item } }));
            });
            button.element.setAttribute('data-item', item);
            this.append(button);
        }
    }

    reload() {
        this.element.dispatchEvent(new CustomEvent('reload', { detail: { view: this } }));
    }
}

module.exports = ListView;
},{"./button":11,"./column":12}],15:[function(require,module,exports){
const View = require('./view');
const ViewGroup = require('./view-group');

class Popup extends ViewGroup {
    constructor(view) {
        super(document.createElement('div'));
        this.element.classList.add('popup');
        this.append(view);
    }
}

module.exports = Popup;
},{"./view":20,"./view-group":19}],16:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Row extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('row');
        this.group = 'rows';
    }
}

module.exports = Row;
},{"./view-group":19}],17:[function(require,module,exports){
const View = require('./view');
const ViewGroup = require('./view-group');

class SVG extends ViewGroup {
    constructor() {
        super(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    }

    line(x1, y1, x2, y2, style) {
        return this.new('line', { x1, y1, x2, y2 }, style);
    }

    rect(x, y, width, height, style) {
        return this.new('rect', { x, y, width, height }, style);
    }

    circle(cx, cy, r, style) {
        return this.new('circle', { cx, cy, r }, style);
    }

    text(x, y, style) {
        return this.new('text', { x, y }, style);
    }

    new(name, attr, style) {
        let view = new View(document.createElementNS('http://www.w3.org/2000/svg', name));
        view.group = name + 's';
        for (const [key, value] of Object.entries(attr)) {
            view.element.setAttribute(key, value);
        }
        view.element.style = style;
        super.append(view);
        return view;
    }
}

module.exports = SVG;
},{"./view":20,"./view-group":19}],18:[function(require,module,exports){
const View = require('./view');
const ViewGroup = require('./view-group');

class TabbedView extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'));
        this.element.classList.add('tabbed-view-content');
        this.views = views;
        this.selectedIndex = 0;
        this.group = 'tabbedViews';
    }

    set selectedIndex(i) {
        let view = this.selectedView;
        if (view) {
            this.remove(view);
        }
        view = this.views[i];
        if (view) {
            view.reload();
            this.append(view);
            this.selectedIndex_ = i;
        } else {
            this.selectedIndex_ = undefined;
        }
    }

    get selectedIndex() {
        return this.selectedIndex_;
    }

    get selectedView() {
        return this.views[this.selectedIndex_];
    }
}

module.exports = TabbedView;
},{"./view":20,"./view-group":19}],19:[function(require,module,exports){
const View = require('./view');

class ViewGroup extends View {
    constructor(element, ...views) {
        super(element);
        this.children = [];
        this.append(...views);
    }

    append(...views) {
        for (let view of views) {
            let { element, group } = view;
            view.parent = this;
            this.element.append(element);
            this.children.push(view);
            if (group) {
                this[group] = this[group] || [];
                this[group].push(view);
            }
        }
    }

    remove(view) {
        let { element, group } = view;
        if (this[group]) {
            let i = this[group].indexOf(element);
            if (i > -1) {
                this[group].splice(i, 1);
            }
        }
        let i = this.children.indexOf(view);
        if (i > -1) {
            this.children.splice(i, 1);
        }
        element.remove();
        view.parent = null;
    }

    reload() {
        this.children.forEach((view) => view.reload());
    }

    update() {
        this.children.forEach((view) => view.update());
    }
}

module.exports = ViewGroup;
},{"./view":20}],20:[function(require,module,exports){
const Hammer = require('hammerjs');

class View {
    constructor(element) {
        this.element = element;
        this.handlers = {};
        this.mc = new Hammer(element);
        this.mc.on('tap press pressup', (event) => {
            this.element.dispatchEvent(new CustomEvent(event.type, { detail: event }));
            this.setNeedsUpdate();
        });
    }

    get root() {
        return this.parent && this.parent.root || this.parent;
    }

    clear() {
        this.element.innerHTML = null;
    }

    on(types, handler) {
        Hammer.on(this.element, types, (event) => {
            try {
                handler(event);
            } finally {
                if (event.type !== 'update') {
                    this.setNeedsUpdate();
                }
            }
        });
        return this;
    }

    flex(flex) {
        this.element.style.flex = flex;
        return this;
    }

    reload() {
        this.element.dispatchEvent(new CustomEvent('reload', { detail: { view: this } }));
    }

    update() {
        this.element.dispatchEvent(new CustomEvent('update', { detail: { view: this } }));
    }

    setNeedsUpdate() {
        let { root } = this;
        root && root.update();
    }
}

module.exports = View;
},{"hammerjs":1}]},{},[3]);
