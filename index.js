const path = require("path");
const express = require("express");
const pg = require("pg");
const cors = require("cors");
const redis = require("redis");
const dotenv = require("dotenv");
const { customRedisRateLimiter, redisCache } = require("./rateLimiter");

dotenv.config({ path: "./config.env" });

//-----------Cache----------
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {},
});

const app = express();
// configs come from standard PostgreSQL env vars
// https://www.postgresql.org/docs/9.6/static/libpq-envars.html
const pool = new pg.Pool();

const queryHandler = (req, res, next) => {
  pool
    .query(req.sqlQuery)
    .then((r) => {
      redisClient.set(
        req.url,
        JSON.stringify(r.rows),
        "ex",
        process.env.DEFAULT_EXPIRATION
      );
      return res.json(r.rows || []);
    })
    .catch(next);
};
//-----------------------
app.use(cors());
app.use(redisCache);
app.use(customRedisRateLimiter);
app.use(express.static(path.resolve(__dirname, "./client/build")));
app.set("trust proxy", true);

//-----------------------
app.get("/api", (req, res) => {
  res.send("Welcome to EQ Works 😎");
});

app.get(
  "/api/events/hourly",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT date, hour, events
    FROM public.hourly_events
    ORDER BY date, hour
    LIMIT 168;
  `;
    return next();
  },
  queryHandler
);

app.get(
  "/api/events/daily",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT date, SUM(events) AS events
    FROM public.hourly_events
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `;
    return next();
  },
  queryHandler
);

app.get(
  "/api/stats/hourly",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT date, hour, impressions, clicks, revenue
    FROM public.hourly_stats
    ORDER BY date, hour
    LIMIT 168;
  `;
    return next();
  },
  queryHandler
);

app.get(
  "/api/stats/daily",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT date,
        SUM(impressions) AS impressions,
        SUM(clicks) AS clicks,
        SUM(revenue) AS revenue
    FROM public.hourly_stats
    GROUP BY date
    ORDER BY date
    LIMIT 7;
  `;
    return next();
  },
  queryHandler
);

// app.get(
//   "/api/poi",
//   (req, res, next) => {
//     req.sqlQuery = `
//     SELECT *
//     FROM public.poi;
//   `;
//     return next();
//   },
//   queryHandler
// );

//-----------------------
app.get(
  "/api/poi/events",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT *
    FROM public.hourly_events
    INNER JOIN public.poi ON public.poi.poi_id=public.hourly_events.poi_id
    ORDER BY date, hour
    LIMIT 168;
  `;
    return next();
  },
  queryHandler
);

app.get(
  "/api/poi/stats",
  (req, res, next) => {
    req.sqlQuery = `
    SELECT *
    FROM public.hourly_stats
    INNER JOIN public.poi ON public.poi.poi_id=public.hourly_stats.poi_id
    ORDER BY date, hour
    LIMIT 168;
  `;
    return next();
  },
  queryHandler
);
//-----------------------

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

app.listen(process.env.PORT || 5555, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.log(`Running on ${process.env.PORT || 5555}`);
  }
});

// last resorts
process.on("uncaughtException", (err) => {
  console.log(`Caught exception: ${err}`);
  process.exit(1);
});
process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  process.exit(1);
});
