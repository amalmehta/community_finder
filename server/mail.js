/* community_finder — outgoing mail.
 *
 * One interface, two transports. The default writes the message to the console
 * and to server/data/outbox/, which is enough to develop and test against with
 * no provider, no API key and no cost. Swapping in a real sender means adding a
 * transport here and setting MAIL_TRANSPORT — nothing else in the app changes.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

function fileTransport(outbox) {
  return {
    name: 'file',
    async send({ to, subject, text }) {
      fs.mkdirSync(outbox, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = path.join(outbox, `${stamp}-${to.replace(/[^a-z0-9@._-]/gi, '_')}.txt`);
      fs.writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
      console.log(`\n--- email to ${to} ---\n${subject}\n${text}\n--- saved to ${file} ---\n`);
      return { ok: true, file };
    }
  };
}

/** Placeholder for a real provider: fill in and set MAIL_TRANSPORT=smtp. */
function unconfiguredTransport(name) {
  return {
    name,
    async send() {
      throw new Error(
        `Mail transport "${name}" is not configured. Set MAIL_TRANSPORT=file for local use, ` +
        'or implement this transport in server/mail.js.'
      );
    }
  };
}

function createMailer({ transport = process.env.MAIL_TRANSPORT || 'file', outbox } = {}) {
  const dir = outbox || path.join(__dirname, 'data', 'outbox');
  const t = transport === 'file' ? fileTransport(dir) : unconfiguredTransport(transport);

  return {
    transport: t.name,
    async sendVerification({ to, link, display }) {
      return t.send({
        to,
        subject: 'Confirm your email for community_finder',
        text:
          `${display ? display + ',' : 'Hello,'}\n\n` +
          'Confirm this address to turn on messaging:\n\n' +
          `${link}\n\n` +
          'The link is good for 24 hours. If you did not ask for this, ignore it — ' +
          'nothing happens until the link is used.\n'
      });
    }
  };
}

module.exports = { createMailer, fileTransport };
