/**
 * ActionRouter
 * Translate messages into actions
 */
class ActionRouter {
    constructor(config) {
        this._config = config;
    }

    handleMessage(message, messenger) {
        const handler = this._resolveActionHandler(message);

        if (handler) {
            const result = handler(message, this, messenger);

            if (result !== undefined) {
                this._router.reply(message.id, {

                });
            }
        }
    }

    /**
     * Protected methods
     */

    _resolveActionHandler(message) {
        return _.get(this._config, _.get(message, 'action'));
    }
}

module.exports = ActionRouter;