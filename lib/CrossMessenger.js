import EventEmitter from 'eventemitter3'
import _has from 'lodash/has'
import _get from 'lodash/get'

/*
Features:
 - Queuing of messages when messenger is not ready. (The send method will send when to ready promise is resolved.)
 - Reply messages (useful to return data or to let the sender know that a message is processed)
 - Promises - when sending a message a promise will be returned
 - Auto serialize/unserialize messages
 - Message scopes to only process messages from the configured scope
 - Auto handshake to detect and confirm when both messenger sides are ready to send and receive messages
 - Optional ActionRouter to transform configured action messages into actions... (run functions on the receiving side, etc.)
 */

/**
 * CrossMessenger
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

    constructor(config) {
        super();

        this._validateConfigAndThrowOnError(config);

        // configureable
        this._targetFrame = (config.targetFrame && 'contentWindow' in config.targetFrame) ? config.targetFrame.contentWindow : config.targetFrame;
        this._targetDomain = config.targetDomain;
        this._messageScope = config.messageScope;
        this._actionRouter = _get(config, 'actionRouter');

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
        const required = ['targetFrame', 'targetDomain', 'messageScope'];

        required.forEach((property) => {
            if (!_has(config, property)) {
                throw new Error(`Config property: "${property}" is required`);
            };
        });

        if (!config.targetFrame) {
            throw new Error('Invalid target frame');
        }

        if (CrossMessenger._registeredMessageScopes.indexOf(config.messageScope) !== -1) {
            throw new Error(`Invalid message scope: ${config.messageScope} is not unique`);
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
            this._targetFrame.postMessage(serializedMessage, this._targetDomain);
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

        const isValidMessage = (_get(message, 'messageScope') === this._messageScope && _has(message, 'id')),
            isHandshake = isValidMessage ? _get(message, 'name') === '_handshake' : null,
            messageId = isValidMessage ? _get(message, 'id') : null,
            expectReply = _get(message, 'expectReply') === true,
            isReply = _has(message, 'replyId');

        // when the message is not a reply but is a _handshake, confirm
        // the handshake by replying.
        if (isValidMessage && isHandshake && messageId) {
            if (!isReply) {
                this.reply(message, true);
            }

            setTimeout(this._setHandshakeSuccess.bind(this));
        }

        // Not a CrossMessenger message or not a message for this instance...
        if (!isValidMessage) {
            return;
        }

        const name = _get(message, 'name'),
            isValidReply = _has(this._waitingForReplyList, _get(message, 'replyId')),
            replyResolver = isValidReply ? this._waitingForReplyList[message.replyId] : null;

        this.emit('receive', message, this);

        if (isValidReply) {
            replyResolver(message);
            delete this._waitingForReplyList[message.replyId];
            this.emit('reply', message, this);
        } else {
            if (expectReply) {
                let replyPayload =  null,
                    success = true,
                    error = null;

                if (this._actionRouter) {
                    try {
                        replyPayload = this._actionRouter.handleMessage(message, this);
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
            } else if(this._actionRouter) {
                this._actionRouter.handleMessage(message, this);
            }

            this.emit('message', message, this);
        }
    }
}

module.exports = CrossMessenger;