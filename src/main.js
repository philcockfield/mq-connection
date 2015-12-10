import R from "ramda";
import Promise from "bluebird";
import amqp from "amqplib";

const CACHE = {};
const isValidUrl = (url) => new RegExp("^(amqp|amqps)://", "i").test(url);


/**
 * Clears the cache and resets all state.
 */
export const reset = () => {
  Object.keys(CACHE).forEach(key => delete CACHE[key]);
};



/**
 * Determines whether a connection for the given URL already exists.
 * @param {String} url: The URL to the AMQP server.
 * @return {Boolean}
 */
export const exists = (url) => CACHE[url] !== undefined;



/**
 * An alternative to the default close method that returns a promise.
 */
const close = (url, conn, closeMethod) => {
  return new Promise((resolve, reject) => {
    delete CACHE[url]; // Remove from cache.
    conn.on("close", () => resolve({ url }));
    closeMethod.call(conn);
  });
};



/**
 * Main entry point to module.
 * Creates or retrieves a cached connection.
 *
 * @param {String} url: The URL to the AMQP/RabbitMQ server.
 *                      Must start with "amqp://"
 *
 * @param {Object} socketOptions: Connection options.
 *                                See: http://www.squaremobius.net/amqp.node/channel_api.html#connect
 * @return {Promise}
 */
export default (url, socketOptions = {}) => {
  // Ensure the URL is adequate.
  if (R.isNil(url) || R.isEmpty(url)) { throw new Error("A url to the AMQP server is required, eg amqp://rabbitmq"); }
  url = url.trim();
  if (!isValidUrl(url)) { throw new Error("A connection url must start with 'amqp://' or 'amqps://'"); }

  return new Promise((resolve, reject) => {
    Promise.coroutine(function*() {

        // Check whether the connection exists.
        if (exists(url)) {

          // Returned the existing connection.
          resolve(CACHE[url]);

        } else {
          try {
            // Establish a new connection and store it.
            const conn = yield amqp.connect(url, socketOptions);
            CACHE[url] = conn;

            // Swap out the close method to one that returns a promise.
            const closeMethod = conn.close;
            conn.close = () => close(url, conn, closeMethod);

            // Finish up.
            resolve(conn);

          } catch (err) {
            reject(err);
          }
        }

    }).call(this);
  });
};
