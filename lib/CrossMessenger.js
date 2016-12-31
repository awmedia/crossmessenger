'use strict';

import EventEmitter from 'eventemitter3'

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
class CrossMessenger extends EventEmitter {
    static _idCounter = 0;

    static _registeredMessageScopes = [];

    constructor({targetFrame, targetOrigin = '*', messageScope, messageHandler } = config) {
        super();

        this._validateConfigAndThrowOnError({targetFrame, targetOrigin, messageScope, messageHandler});

        // configureable
        this._targetFrame = (targetFrame && 'contentWindow' in targetFrame) ? targetFrame.contentWindow : targetFrame
        this._targetOrigin = targetOrigin;
        this._messageScope = messageScope;
        this._messageHandler = messageHandler;

        if (typeof this._messageHandler == 'object') {
            this._messageHandler = this._messageHandler.handleMessage;
        }

        // protected
        this._waitingForReplyList = {};
        this._hasHandshake = false;
        this._isDomReady = false;

        this._isReady = new Promise((resolve, reject) => {
            this._isReadyResolver = resolve;
            this._isReadyRejector = reject;
        });

        // start listening to incoming messages
        window.addEventListener('message', this._handleReceive);

        // Is dom ready? If so, mark internal ready state as true, otherwise attach
        // an event listener to the document to detect when dom is ready...
        if (document.readyState === 'complete') {
            setTimeout(this._setDomSuccess.bind(this));
        } else {
            document.addEventListener('DOMContentLoaded', this._setDomSuccess);
            window.addEventListener('load', this._setDomSuccess);
        }
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
    reply(messageOrId, messageData = {}) {
        const baseMessage = (typeof messageOrId == 'object') ? messageOrId : { id: messageOrId },
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
    send(message, expectReply = false, force = false) {
        if (force) {
            return this._send(message, expectReply);
        } else {
            return this._isReady.then(() => this._send(message, expectReply));
        }
    }

    /**
     * Protected methods
     */

    _validateConfigAndThrowOnError(config) {
        const required = ['targetFrame', 'targetOrigin', 'messageScope'];

        required.forEach((property) => {
            if (!(property in config)) {
                throw new Error(`Config property: "${property}" is required`);
            };
        });

        if (!config.targetFrame) {
            throw new Error('Invalid target frame');
        }

        if (CrossMessenger._registeredMessageScopes.indexOf(config.messageScope) !== -1) {
            throw new Error(`Invalid message scope: ${config.messageScope} is not unique`);
        }

        if (config.messageHandler) {
            if (typeof config.messageHandler == 'object' && !('handleMessage' in config.messageHandler)) {
                throw new Error('Message handler object should contain a "handleMessage" function');
            } else if(['object', 'function'].indexOf(typeof config.messageHandler) === -1) {
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
    _send = (message, expectReply = false) => {
        const id = String(CrossMessenger._idCounter++);

        let result,
            serializedMessage;

        if (expectReply) {
            result = new Promise((resolve) => {
                this._waitingForReplyList[id] = resolve;
            });
        } else {
            result = Promise.resolve();
        }

        message.id = id;
        message.messageScope = this._messageScope;
        message.expectReply = expectReply;

        try {
            serializedMessage = JSON.stringify(message);
            this.emit('send', message);
            this._targetFrame.postMessage(serializedMessage, this._targetOrigin);
        } catch(error) {
            throw new Error('Could not serialize message: ' + error);
        }

        return result;
    }

    _setHandshakeSuccess = () => {
        if (!this._hasHandshake) {
            this._hasHandshake = true;
            this.emit('handshake', this);
            this._setReadyWhenReady();

        }
    }

    _setDomSuccess = () => {
        if (!this._isDomReady) {
            this._isDomReady = true;

            this.emit('domready', this);
            this._setReadyWhenReady();

            if (!this._hasHandshake) {
                this.send({ name: '_handshake' }, false, true);
            }
        }
    }

    _setReadyWhenReady() {
        if (this._hasHandshake && this._isDomReady) {
            this._isReadyResolver();
            this.emit('ready', this);
        }
    }

    /**
     * Event handler methods
     */

    _handleReceive = (postMessage) => {
        let message;

        try {
            message = JSON.parse(postMessage.data);
        } catch(error) {
            // Could not parse message. Message is invalid, so ignore...
            return;
        }

        const {id, messageScope, name, expectReply, replyId} = message,
              isValidMessage = (messageScope === this._messageScope && !!id),
              isHandshake = (isValidMessage && name === '_handshake'),
              isReply = !!replyId;

        // when the message is not a reply but is a _handshake, confirm
        // the handshake by replying.
        if (isValidMessage && isHandshake && id) {
            if (!isReply) {
                this.reply(message, true);
            }

            setTimeout(this._setHandshakeSuccess.bind(this));
        }

        // Not a CrossMessenger message or not a message for this instance...
        if (!isValidMessage) {
            return;
        }

        const isValidReply = replyId in this._waitingForReplyList,
              replyResolver = isValidReply ? this._waitingForReplyList[replyId] : null;

        this.emit('receive', message, this);

        if (isValidReply) {
            replyResolver(message);
            delete this._waitingForReplyList[replyId];
            this.emit('reply', message, this);
        } else {
            if (expectReply) {
                let replyPayload =  null,
                    success = true,
                    error = null;

                if (this._messageHandler) {
                    try {
                        replyPayload = this._messageHandler(message, this);
                    } catch(error) {
                        error = error.getMessage();
                        success = false;
                    }
                }

                this.reply({
                    ...message,
                    payload: replyPayload,
                    success,
                    error
                });
            } else if(this._messageHandler) {
                this._messageHandler(message, this);
            }

            this.emit('message', message, this);
        }
    }
}

module.exports = CrossMessenger;
