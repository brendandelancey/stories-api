const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
if (admin.apps.length === 0) {
  console.log("----------------------------");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lac-media.firebaseio.com",
  });
}

// // import * as cors from "cors";
// const corsHandler = cors({ origin: true });

const authenticationhMiddleware = require("./auth");

const {Configuration, OpenAIApi} = require("openai");
const dotenv = require("dotenv");
dotenv.config({path: "../.env"});
// const dotenv = require("dotenv");
// dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_AUTHORIZATION_KEY,
});

const express = require("express");

const openai = new OpenAIApi(configuration);
const {v4: uuidv4} = require("uuid");

const db = admin.database();
const cors = require("cors")({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
  credentials: true,
  preflightContinue: false, // ! change
  allowedHeaders: ["Content-Type", "Authorization"],
});
const app = express();

// { origin: true }
app.use(express.json());
// app.use(
//   cors({
//     origin: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
//     credentials: true,
//     preflightContinue: false, // ! change
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );
app.use(cors);

app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "https://lac-media.web.app",
    "Access-Control-Allow-Methods":
      "POST, PUT, PATCH, GET, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "*",
    // "Origin,X-Api-Key,X-Requested-With,Content-Type,Accept,Authorization",
    "Access-Control-Max-Age": "3600",
    "Access-Control-Allow-Credentials": true,
  });
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header(
  //   'Access-Control-Allow-Methods',
  //   'POST, PUT, PATCH, GET, DELETE, OPTIONS',
  // );
  // res.header(
  //   'Access-Control-Allow-Headers',
  //   'Origin, X-Api-Key, X-Requested-With,
  // Content-Type, Accept, Authorization',
  // );
  next();
});

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//   next();
// });

app.get("/", (req, res) => {
  console.log("aaaaaaaaaaaaa");

  return res
    .status(200)
    .json("hello from user route " + process.env.OPENAI_AUTHORIZATION_KEY);
});

app.post("/createStory", authenticationhMiddleware, async (req, res) => {
  // res.set({
  //   "Access-Control-Allow-Origin": "*",
  //   "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  //   "Access-Control-Allow-Headers": "Content-Type, Authorization",
  //   "Access-Control-Max-Age": "3600",
  // });
  console.log("222222222222222");
  // corsHandler(req, res, async () => {
  console.log("3333333333333");
  // send request
  //  for "steel man argument for" topic entered by admin
  // predetermined political view "View Point" (data sent)
  // Ex "steel man argument for 'imigration', from the
  // plotical view of 'Liberal'"
  // {items in '' are sent from admin webpage and passed through request}

  // console.log(process.env.OPENAI_AUTHORIZATION_KEY);
  // !
  try {
    const completion = await openai.createCompletion(
      {
        model: "text-davinci-003",
        prompt: req.body.message,
        max_tokens: 2048,
      },
      {
        timeout: 1000000,
      },
    );
    console.log(completion.data.choices[0].text);

    res.send(completion.data.choices[0].text);
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});
// });

// Make sure to add Token to this call from login
// Post story to appropriate spot in db (will be calling this
// request twice every submit for both sides)
app.post("/postStory", authenticationhMiddleware, async (req, res) => {
  const date = new Date();
  const day = date.getDate(); // x 1,000
  const month = date.getMonth() + 1; // x 10,000
  const year = date.getFullYear(); // x 100,000

  const hours = date.getHours(); // x 100
  const minutes = date.getMinutes(); // x 10
  const seconds = date.getSeconds();

  // ! Order = larger number - ((year x100,000) + (month x 10,000)
  // ! + (day x 1,000) + (hours x 100) + (minutes x 10) + (seconds x 1))

  const order =
    100000000000000000 -
    (year * 100000 +
      month * 10000 +
      day * 1000 +
      hours * 100 +
      minutes * 10 +
      seconds * 1);

  // This arrangement can be altered based on how we want
  // the date's format to appear.
  const currentDate = `${day}-${month}-${year}`;
  console.log(currentDate); // "17-6-2022"
  console.log(date);
  // Structure:
  // UUID: random
  // content: chatGPT submitted answer
  // credit: "chatGPT"
  // date created: today date
  // Image: "Might remove or use ai art"
  // Order: 999 {and going down} could use a
  // function to turn the date into a number
  // like 2022 * 1000 + 12 * 100 + 31 =
  // Title: "Argument for 'View Point'"

  const story = req.body.story;

  const viewpoint = req.body.viewpoint;
  const title = req.body.title;

  const storyObject = {
    UUID: uuidv4(),
    content: story,
    credit: "chatGPT",
    date_created: currentDate,
    Image: "Might remove or use ai art",
    Order: order,
  };

  try {
    db.ref(viewpoint + "/" + title).set(storyObject);
    res.status(201).send();
  } catch (e) {
    console.error("Error making post request:", e);
    console.log("ERROR");
    res.status(400).send();
  }
});

exports.app = functions.https.onRequest(app);
