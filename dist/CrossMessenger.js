(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["CrossMessenger"] = factory();
	else
		root["CrossMessenger"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	module.exports = __webpack_require__(1);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _class, _temp, _initialiseProps;
	
	var _eventemitter = __webpack_require__(2);
	
	var _eventemitter2 = _interopRequireDefault(_eventemitter);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	/*
	Features:
	 - Queuing of messages when messenger is not ready. (The send method will send when to ready promise is resolved.)
	 - Reply messages (useful to return data or to let the sender know that a message is processed)
	 - Promises - when sending a message a promise will be returned
	 - Auto serialize/unserialize messages
	 - Message scopes to only process messages from the configured scope
	 - Auto handshake to detect and confirm when both messenger sides are ready to send and receive messages
	 */
	
	/**
	 * CrossMessenger
	 * Messenger to communicate between frames through postMessage. Messages can be replied to confirm processing or to return
	 * data. Use the custom messageHandler to control the return value.
	 * When sending a message, a Promise will be the return value. When the optional param "expectReply" is true, the Promise will be resolved after the
	 * other side has replied the message with the reply message object as the argument. When false, the Promise will be resolved instantly.
	 *
	 * @param   config.targetFrame          Ref to the target element (iframe or window.parent (when in iframe)). The target element should support postMessage.
	 * @param   config.targetOrigin         Default *
	 * @param   config.messageScope         Scope of messages to accept. Messages from other scopes will be ignored. The scope of the sender and receiver should be equal.
	 * @param   config.messageHandler       A class or object with a "handleMessage" function or a function. Params: message and messenger. The return value of the messageHandler will be used as the reply payload...
	 *
	 * @event   receive     When a message or a reply is received
	 * @event   message     When a message is received  (NOT a reply)
	 * @event   send        When a message will be sended
	 * @event   reply       When a reply is received
	 * @event   domready    When the DOM is ready
	 * @event   handshake   When handshake is successful and ready
	 * @event   ready       When both, the dom and the handshake, are successful and ready
	 */
	var CrossMessenger = (_temp = _class = function (_EventEmitter) {
	    _inherits(CrossMessenger, _EventEmitter);
	
	    function CrossMessenger() {
	        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config,
	            targetFrame = _ref.targetFrame,
	            _ref$targetOrigin = _ref.targetOrigin,
	            targetOrigin = _ref$targetOrigin === undefined ? '*' : _ref$targetOrigin,
	            messageScope = _ref.messageScope,
	            messageHandler = _ref.messageHandler;
	
	        _classCallCheck(this, CrossMessenger);
	
	        var _this = _possibleConstructorReturn(this, (CrossMessenger.__proto__ || Object.getPrototypeOf(CrossMessenger)).call(this));
	
	        _initialiseProps.call(_this);
	
	        _this._validateConfigAndThrowOnError({ targetFrame: targetFrame, targetOrigin: targetOrigin, messageScope: messageScope, messageHandler: messageHandler });
	
	        // configureable
	        _this._targetFrame = targetFrame && 'contentWindow' in targetFrame ? targetFrame.contentWindow : targetFrame;
	        _this._targetOrigin = targetOrigin;
	        _this._messageScope = messageScope;
	        _this._messageHandler = messageHandler;
	
	        if (_typeof(_this._messageHandler) == 'object') {
	            _this._messageHandler = _this._messageHandler.handleMessage;
	        }
	
	        // protected
	        _this._waitingForReplyList = {};
	        _this._hasHandshake = false;
	        _this._isDomReady = false;
	
	        _this._isReady = new Promise(function (resolve, reject) {
	            _this._isReadyResolver = resolve;
	            _this._isReadyRejector = reject;
	        });
	
	        // start listening to incoming messages
	        window.addEventListener('message', _this._handleReceive);
	
	        // Is dom ready? If so, mark internal ready state as true, otherwise attach
	        // an event listener to the document to detect when dom is ready...
	        if (document.readyState === 'complete') {
	            setTimeout(_this._setDomSuccess.bind(_this));
	        } else {
	            document.addEventListener('DOMContentLoaded', _this._setDomSuccess);
	            window.addEventListener('load', _this._setDomSuccess);
	        }
	        return _this;
	    }
	
	    /**
	     * Public methods
	     */
	
	    /**
	     * reply
	     * @param messageOrId
	     * @param messageData   additional message data, will be merged with message
	     * @return {*}
	     */
	
	
	    _createClass(CrossMessenger, [{
	        key: 'reply',
	        value: function reply(messageOrId) {
	            var messageData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	
	            var baseMessage = (typeof messageOrId === 'undefined' ? 'undefined' : _typeof(messageOrId)) == 'object' ? messageOrId : { id: messageOrId },
	                message = Object.assign({}, baseMessage, messageData, { replyId: baseMessage.id });
	
	            return this.send(message);
	        }
	
	        /**
	         * send
	         * Message will only be send when both sides are ready to send and
	         * receive messages, or when "force" is true;
	         * @param message
	         * @param expectReply
	         * @param force         boolean     true to send even when system is not ready (used internally for handshake)
	         */
	
	    }, {
	        key: 'send',
	        value: function send(message) {
	            var _this2 = this;
	
	            var expectReply = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	            var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	
	            if (force) {
	                return this._send(message, expectReply);
	            } else {
	                return this._isReady.then(function () {
	                    return _this2._send(message, expectReply);
	                });
	            }
	        }
	
	        /**
	         * Protected methods
	         */
	
	    }, {
	        key: '_validateConfigAndThrowOnError',
	        value: function _validateConfigAndThrowOnError(config) {
	            var required = ['targetFrame', 'targetOrigin', 'messageScope'];
	
	            required.forEach(function (property) {
	                if (!(property in config)) {
	                    throw new Error('Config property: "' + property + '" is required');
	                };
	            });
	
	            if (!config.targetFrame) {
	                throw new Error('Invalid target frame');
	            }
	
	            if (CrossMessenger._registeredMessageScopes.indexOf(config.messageScope) !== -1) {
	                throw new Error('Invalid message scope: ' + config.messageScope + ' is not unique');
	            }
	
	            if (config.messageHandler) {
	                if (_typeof(config.messageHandler) == 'object' && !('handleMessage' in config.messageHandler)) {
	                    throw new Error('Message handler object should contain a "handleMessage" function');
	                } else if (['object', 'function'].indexOf(_typeof(config.messageHandler)) === -1) {
	                    throw new Error('Message handler should be a function of an object with a "handleMessage" function...');
	                }
	            }
	        }
	
	        /**
	         * _send
	         * Unsafe send method. Will send message without taking into account if both sides
	         * are ready to send and receive messages.
	         * @param message
	         */
	
	    }, {
	        key: '_setReadyWhenReady',
	        value: function _setReadyWhenReady() {
	            if (this._hasHandshake && this._isDomReady) {
	                this._isReadyResolver();
	                this.emit('ready', this);
	            }
	        }
	
	        /**
	         * Event handler methods
	         */
	
	    }]);
	
	    return CrossMessenger;
	}(_eventemitter2.default), _class._idCounter = 0, _class._registeredMessageScopes = [], _initialiseProps = function _initialiseProps() {
	    var _this3 = this;
	
	    this._send = function (message) {
	        var expectReply = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	
	        var id = String(CrossMessenger._idCounter++);
	
	        var result = void 0,
	            serializedMessage = void 0;
	
	        if (expectReply) {
	            result = new Promise(function (resolve) {
	                _this3._waitingForReplyList[id] = resolve;
	            });
	        } else {
	            result = Promise.resolve();
	        }
	
	        message.id = id;
	        message.messageScope = _this3._messageScope;
	        message.expectReply = expectReply;
	
	        try {
	            serializedMessage = JSON.stringify(message);
	            _this3.emit('send', message);
	            _this3._targetFrame.postMessage(serializedMessage, _this3._targetOrigin);
	        } catch (error) {
	            throw new Error('Could not serialize message: ' + error);
	        }
	
	        return result;
	    };
	
	    this._setHandshakeSuccess = function () {
	        if (!_this3._hasHandshake) {
	            _this3._hasHandshake = true;
	            _this3.emit('handshake', _this3);
	            _this3._setReadyWhenReady();
	        }
	    };
	
	    this._setDomSuccess = function () {
	        if (!_this3._isDomReady) {
	            _this3._isDomReady = true;
	
	            _this3.emit('domready', _this3);
	            _this3._setReadyWhenReady();
	
	            if (!_this3._hasHandshake) {
	                _this3.send({ name: '_handshake' }, false, true);
	            }
	        }
	    };
	
	    this._handleReceive = function (postMessage) {
	        var message = void 0;
	
	        try {
	            message = JSON.parse(postMessage.data);
	        } catch (error) {
	            // Could not parse message. Message is invalid, so ignore...
	            return;
	        }
	
	        var _message = message,
	            id = _message.id,
	            messageScope = _message.messageScope,
	            name = _message.name,
	            expectReply = _message.expectReply,
	            replyId = _message.replyId,
	            isValidMessage = messageScope === _this3._messageScope && !!id,
	            isHandshake = isValidMessage && name === '_handshake',
	            isReply = !!replyId;
	
	        // when the message is not a reply but is a _handshake, confirm
	        // the handshake by replying.
	
	        if (isValidMessage && isHandshake && id) {
	            if (!isReply) {
	                _this3.reply(message, true);
	            }
	
	            setTimeout(_this3._setHandshakeSuccess.bind(_this3));
	        }
	
	        // Not a CrossMessenger message or not a message for this instance...
	        if (!isValidMessage) {
	            return;
	        }
	
	        var isValidReply = replyId in _this3._waitingForReplyList,
	            replyResolver = isValidReply ? _this3._waitingForReplyList[replyId] : null;
	
	        _this3.emit('receive', message, _this3);
	
	        if (isValidReply) {
	            replyResolver(message);
	            delete _this3._waitingForReplyList[replyId];
	            _this3.emit('reply', message, _this3);
	        } else {
	            if (expectReply) {
	                var replyPayload = null,
	                    success = true,
	                    error = null;
	
	                if (_this3._messageHandler) {
	                    try {
	                        replyPayload = _this3._messageHandler(message, _this3);
	                    } catch (error) {
	                        error = error.getMessage();
	                        success = false;
	                    }
	                }
	
	                _this3.reply(_extends({}, message, {
	                    payload: replyPayload,
	                    success: success,
	                    error: error
	                }));
	            } else if (_this3._messageHandler) {
	                _this3._messageHandler(message, _this3);
	            }
	
	            _this3.emit('message', message, _this3);
	        }
	    };
	}, _temp);
	
	
	module.exports = CrossMessenger;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';
	
	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @api private
	 */
	function Events() {}
	
	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);
	
	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}
	
	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {Mixed} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}
	
	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}
	
	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;
	
	  if (this._eventsCount === 0) return names;
	
	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }
	
	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }
	
	  return names;
	};
	
	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Boolean} exists Only check if there are listeners.
	 * @returns {Array|Boolean}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event, exists) {
	  var evt = prefix ? prefix + event : event
	    , available = this._events[evt];
	
	  if (exists) return !!available;
	  if (!available) return [];
	  if (available.fn) return [available.fn];
	
	  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
	    ee[i] = available[i].fn;
	  }
	
	  return ee;
	};
	
	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) return false;
	
	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;
	
	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);
	
	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }
	
	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }
	
	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;
	
	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);
	
	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }
	
	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }
	
	  return true;
	};
	
	/**
	 * Add a listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this)
	    , evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];
	
	  return this;
	};
	
	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {Mixed} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true)
	    , evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
	  else if (!this._events[evt].fn) this._events[evt].push(listener);
	  else this._events[evt] = [this._events[evt], listener];
	
	  return this;
	};
	
	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {String|Symbol} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {Mixed} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;
	
	  if (!this._events[evt]) return this;
	  if (!fn) {
	    if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	    return this;
	  }
	
	  var listeners = this._events[evt];
	
	  if (listeners.fn) {
	    if (
	         listeners.fn === fn
	      && (!once || listeners.once)
	      && (!context || listeners.context === context)
	    ) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	           listeners[i].fn !== fn
	        || (once && !listeners[i].once)
	        || (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }
	
	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else if (--this._eventsCount === 0) this._events = new Events();
	    else delete this._events[evt];
	  }
	
	  return this;
	};
	
	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {String|Symbol} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;
	
	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) {
	      if (--this._eventsCount === 0) this._events = new Events();
	      else delete this._events[evt];
	    }
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }
	
	  return this;
	};
	
	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	
	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};
	
	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;
	
	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;
	
	//
	// Expose the module.
	//
	if (true) {
	  module.exports = EventEmitter;
	}


/***/ }
/******/ ])
});
;
//# sourceMappingURL=CrossMessenger.map