import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.listen(3000, () =>
  console.log("API iniciada em http://localhost:3000")
);