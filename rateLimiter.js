const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
//---------------------

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {},
});
redisClient.flushall();

//-----------Cache----------

module.exports.redisCache = (req, res, next) => {
  try {
    redisClient.get(req.url, function (err, record) {
      if (err) throw err;
      if (record != null) return res.json(JSON.parse(record));
      return next();
    });
  } catch (error) {
    next(error);
  }
};

//-----------Rate Limiter----------

module.exports.customRedisRateLimiter = (req, res, next) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    redisClient.get(ip, (err, current) => {
      if (err) throw err;
      if (current && +current >= +process.env.MAX_REQUEST)
        redisClient.ttl(ip, (err, ttl) => {
          return res.status(429).json({
            status: "fail",
            message: `You have exceeded the ${
              process.env.MAX_REQUEST
            } requests. Try again in ${(ttl / 60).toFixed(2)} minutes.`,
          });
        });
      else {
        redisClient
          .multi()
          .set(ip, 0, "NX", "EX", process.env.RATE_LIMITER_EXPIRATION)
          .incr(ip)
          .exec((err) => {
            if (err) throw err;
          });
        next();
      }
    });
  } catch (error) {
    next(error);
  }
};
