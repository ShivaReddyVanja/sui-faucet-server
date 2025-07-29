import express from 'express';
import { config } from './config';
import logger from './logger';
import cors from "cors"
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import FaucetRouter from "./routes/faucet";
import AdminRouter from "./routes/admin";
import AuthRouter from "./routes/auth";
import { configLoader } from './utils/faucetConfigLoader';
import { initRateLimiters } from './middlewares/ratelimiters';
import { syncAdminsFromEnv } from './utils/syncAdmins';

dotenv.config();

async function main(){
const app = express();

await configLoader.load();
await syncAdminsFromEnv();
await initRateLimiters();    


// app.use(cors({
//   origin: "http://localhost:3000" ,
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials:true
// }));
app.use(cors());
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());

app.get("/",(req,res)=>{
  res.status(200).json({message:"Dont worry about me, Im working good bro"});
})

app.use("/api",FaucetRouter);
app.use("/api",AuthRouter);
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
