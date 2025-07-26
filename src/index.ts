import express from 'express';
import { config } from './config';
import logger from './logger';
import cors from "cors"
import dotenv from "dotenv";
import FaucetRouter from "./routes/faucet";
import AdminRouter from "./routes/admin";
import { configLoader } from './utils/faucetConfigLoader';
import { initRateLimiters } from './middlewares/ratelimiters';

dotenv.config();

async function main(){
const app = express();

await configLoader.load();
await initRateLimiters();    

app.use(cors({
  origin: "https://www.artiswap.xyz", // ✅ Only allow this domain
  methods: ["GET", "POST", "PUT", "DELETE"], // Add what you use
}));

app.set('trust proxy', true);
app.use(express.json());

app.get("/",(req,res)=>{
  res.status(200).json({message:"Dont worry about me, Im working good bro"});
})

app.use("/api",FaucetRouter);
app.use("/api",AdminRouter);

const port = process.env.PORT || config.port;

app.listen(port, () => {
  logger.info(`Server running on port ${config.port}`);
});
}

main().catch((err) => {
  logger.error(`❌ Server failed to start: ${err.message}`);
  process.exit(1);
});
