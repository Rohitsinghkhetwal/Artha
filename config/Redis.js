import redis from "redis"

let redisClient = null


const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      
    });

    redisClient.on('error', (err) => {
      console.error(' Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log(' Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis connected and ready');
    });

    await redisClient.connect();
    return redisClient;

  } catch (error) {
    console.error(' Redis Connection Failed:', error.message);
    throw error;
  }
};

export default connectRedis