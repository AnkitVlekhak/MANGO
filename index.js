import express from "express";
import bodyParser from "body-parser";
// import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import dotenv from "dotenv";
import listRoutes from "./routes/listRoutes.js";
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();
const password = encodeURIComponent("Le5jtH3rLZDhOC70");
mongoose
  .connect(
    `mongodb+srv://ankit-mongo:${password}@cluster0.ffmsigo.mongodb.net/EmailDB?retryWrites=true&w=majority&appName=Cluster0`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() =>
    app.listen(process.env.PORT, () =>
      console.log(`Listening at ${process.env.PORT}`)
    )
  )
  .catch((error) => console.log(error));

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  properties: { type: Map, of: String },
  list: { type: Schema.Types.ObjectId, ref: "Lists" },
  unsubscribed: { type: Boolean, default: false },
});
const userModel = new model("Users", userSchema);

const listSchema = new Schema({
  title: { type: String, required: true },
  customProperties: [{ type: Schema.Types.ObjectId, ref: "CustomProperties" }],
});
const listModel = model("Lists", listSchema);

const customPropertySchema = new Schema({
  title: { type: String, required: true },
  fallbackValue: { type: String, required: true },
});
const customPropertyModel = new model("CustomProperties", customPropertySchema);
export { listModel, userModel, customPropertyModel };
app.use("/api", listRoutes);
