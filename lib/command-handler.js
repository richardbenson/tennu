const EventEmitter = require('./event-emitter.js');
const inspect = require('util').inspect;
const format = require('util').format;
const lodash = require('lodash');
const Q = require('q');

const badResponseFormat = 'Command handler for %s returned with invalid value: %s';

function Command (privmsg, command_text) {
    const args = command_text.split(/ +/);
    const commandname = args.shift().toLowerCase();

    return lodash.create(privmsg, {
        args: args,
        command: commandname
    });
}

function startsWith(str, prefix) {
    return str.substring(0, prefix.length) === prefix;
}

// nickname is a function that returns the nickname of the receiver.
function CommandParser (config, nickname, logger) {
    var trigger = config.trigger || '!';

    function getMaybeCommandString (privmsg) {
        function removeTrigger (string) {
            return string.substring(trigger.length);
        }

        if (startsWith(privmsg.message, trigger)) {
            return removeTrigger(privmsg.message);
        }

        if (privmsg.isQuery) {
            return privmsg.message;
        }

        if (startsWith(privmsg.message, nickname())) {
            // Trimming in case of multiple spaces. e.g. (raw message)
            // nick!user@host PRIVMSG #chan botname:   do something
            const message = privmsg.message.substring(privmsg.message.indexOf(' ') + 1).trim();
            return startsWith(message, trigger) ? removeTrigger(message) : message;
        }

        return false;
    };

    const parser = Object.create(EventEmitter());

    parser.parse = function (privmsg) {
        const maybeCommand = getMaybeCommandString(privmsg);

        if (maybeCommand) {
            const command = Command(privmsg, maybeCommand);
            logger.notice('Command Handler', 'Emitting command:', command.command);
            this.emit(command.command, command);
        }

        return command;
    };

    parser.after(function (err, res, type, command) {
        // Response types allowed:
        //     string U [string] U Promise<string U [string]>
        if (err) {
            logger.error('Command Handler', 'Error thrown in command handler!');
            logger.error('Command Handler', err.stack);
            return;
        }

        // Tests require that the undefined case return immediately.
        if (res === undefined) {
            return;
        }

        if (Array.isArray(res) || typeof res === 'string') {
            res = Q(res);
        }

        if (typeof res.then !== 'function') {
            logger.error('Command Handler', format(badResponseFormat, command.command, String(res)));
            return;
        }

        res.then(function (res) {
            // FIXME: Pass receiver to Command Handler at initialization.
            command.receiver.say(command.channel, res);
        });
    });

    return parser;
};

module.exports = CommandParser;