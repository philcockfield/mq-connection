import Promise from "bluebird";
import { delay } from "../util";


/**
 * A fake {Channel} used for testing.
 *
 * See: http://www.squaremobius.net/amqp.node/channel_api.html#channel
 *
 */
export default class FakeChannel {
  assertExchange(exchange, type, options = {}) {
    // http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange
    return new Promise((resolve, reject) => {
      delay(1, () => resolve(true))
    });
  }
};
