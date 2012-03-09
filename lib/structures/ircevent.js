var parsers = require('../parsers');

var ircEvent = function (message, irc) {
  var ixa = -1, ixb = -1;

  if (message[0] === ":") {
    ixa = message.indexOf(" ");
    this.prefix = message.slice(1, ixa);
    this.prefixtype = parsers.prefix(this.prefix);
  }

  ixb = message.indexOf(" ", ixa + 1);

  this.name = message.slice(ixa + 1, ixb).toLowerCase();
  this.params = parsers.params(message.slice(ixb + 1));
  this.message = this.params[1];

  switch (this.name) {
    case "join":
    case "part":
    case "privmsg":
      this.actor = parsers.hostmask(this.prefix, "nick");
      this.channel = this.params[0].toLowerCase();
      break;
    case "privmsg":
      this.actor = parsers.hostmask(this.prefix, "nick");
      this.channel = this.params[0].toLowerCase();
      this.isQuery = (this.channel === irc.nick);
      break;
    case "quit":
      this.actor = parsers.hostmask(this.prefix, "nick");
      this.reason = this.params[0].toLowerCase();
      break;
    case "nick":
      this.actor = parsers.hostmask(this.prefix, "nick");
      this.newNick = this.params[0].toLowerCase();
      break;
    default:
      void 0;
  }
}

ircEvent.prototype = {
  type: "irc",
}

module.exports = ircEvent;