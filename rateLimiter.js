const moment = require("moment");
const redis = require("redis");

//---------------------

const redisClient = redis.createClient({
  host: "us1-legal-trout-34915.upstash.io",
  port: "34915",
  password: "ff342ff9e2e841e78b4398203fdd0a79",
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
const WINDOW_SIZE_IN_HOURS = 24;
const MAX_WINDOW_REQUEST_COUNT = 50;
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

module.exports.customRedisRateLimiter = (req, res, next) => {
  try {
    // check that redis client exists
    if (!redisClient) {
      console.log("Redis client does not exist!");
      process.exit(1);
    }

    // fetch records of current user using IP address, returns null when no record is found
    redisClient.get(req.ip, function (err, record) {
      if (err) throw err;
      const currentRequestTime = moment();

      //  if no record is found , create a new record for user and store to redis
      if (record == null) {
        let newRecord = [];
        let requestLog = {
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        };
        newRecord.push(requestLog);
        redisClient.set(req.ip, JSON.stringify(newRecord));
        return next();
      }
      // if record is found, parse it's value and calculate number of requests users has made within the last window
      let data = JSON.parse(record);
      let windowStartTimestamp = moment()
        .subtract(WINDOW_SIZE_IN_HOURS, "hours")
        .unix();
      let requestsWithinWindow = data.filter((entry) => {
        return entry.requestTimeStamp > windowStartTimestamp;
      });
      console.log("requestsWithinWindow", requestsWithinWindow);
      let totalWindowRequestsCount = requestsWithinWindow.reduce(
        (accumulator, entry) => {
          return accumulator + entry.requestCount;
        },
        0
      );
      // if number of requests made is greater than or equal to the desired maximum, return error
      if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
        console.log(err);
        res.status(429).json({
          status: "fail",
          message: `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit!`,
        });
      } else {
        // if number of requests made is less than allowed maximum, log new entry
        let lastRequestLog = data[data.length - 1];
        let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
          .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
          .unix();
        //  if interval has not passed since last request log, increment counter
        if (
          lastRequestLog.requestTimeStamp >
          potentialCurrentWindowIntervalStartTimeStamp
        ) {
          lastRequestLog.requestCount++;
          data[data.length - 1] = lastRequestLog;
        } else {
          //  if interval has passed, log new entry for current user and timestamp
          data.push({
            requestTimeStamp: currentRequestTime.unix(),
            requestCount: 1,
          });
        }
        redisClient.set(req.ip, JSON.stringify(data));
        next();
      }
    });
  } catch (error) {
    next(error);
  }
};
