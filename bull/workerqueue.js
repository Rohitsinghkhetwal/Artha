import Queue from "bull";
import dotenv from "dotenv";
import { QUEUE_NAMES } from "../config/constant.js"


dotenv.config({
  path: "./config.env"
})

const workerQueue = new Queue(QUEUE_NAMES.JOB_IMPORT, {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
})


export { workerQueue }