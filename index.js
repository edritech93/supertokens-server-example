const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
let supertokens = require("supertokens-node");
let { verifySession } = require("supertokens-node/recipe/session/framework/express");
let { middleware, errorHandler } = require("supertokens-node/framework/express");
let EmailPassword = require("supertokens-node/recipe/emailpassword");
let Session = require("supertokens-node/recipe/session");
let JWT = require("supertokens-node/recipe/jwt");
const axios = require('axios');

const apiPort = process.env.REACT_APP_API_PORT || 3001;
const apiDomain = process.env.REACT_APP_API_URL || `http://localhost:${apiPort}`;
const websitePort = process.env.REACT_APP_WEBSITE_PORT || 3000;
const websiteDomain = process.env.REACT_APP_WEBSITE_URL || `http://localhost:${websitePort}`;

const SUPERTOKENS_URL = 'http://159.138.107.170:3567'

supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: SUPERTOKENS_URL,
        apiKey: "<REQUIRED FOR MANAGED SERVICE, ELSE YOU CAN REMOVE THIS FIELD>",
    },
    appInfo: {
        appName: "SuperTokens Apps", // TODO: Your app name
        apiDomain, // TODO: Change to your app's API domain
        websiteDomain, // TODO: Change to your app's website domain
    },
    // recipeList: [EmailPassword.init(), Session.init()],
    // recipeList: [
    //     Session.init({
    //         jwt: {
    //             enable: true,
    //         },
    //         override: {
    //           functions: function (originalImplementation) {
    //               return {
    //                   ...originalImplementation,
    //                   createNewSession: async function (input) {
    //                       input.accessTokenPayload = {
    //                           ...input.accessTokenPayload,
    //                           /*
    //                           * AWS requires JWTs to contain an audience (aud) claim
    //                           * The value for this claim should be the same
    //                           * as the value you set when creating the
    //                           * authorizer
    //                           */
    //                           aud: "jwtAuthorizers",
    //                       };
  
    //                       return originalImplementation.createNewSession(input);
    //                   },
    //               };
    //           }
    //       },
    //     }),
    //   ],
    recipeList: [
        EmailPassword.init(),
        Session.init({
            jwt: {
                enable: true,
            },
        })
    ]
});

const app = express();

app.use(
    cors({
        origin: websiteDomain, // TODO: Change to your app's website domain
        allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
        methods: ["GET", "PUT", "POST", "DELETE"],
        credentials: true,
    })
);

app.use(morgan("dev"));
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(middleware());

// custom API that requires session verification
app.get("/sessioninfo", verifySession(), async (req, res) => {
    let session = req.session;
    res.send({
        sessionHandle: session.getHandle(),
        userId: session.getUserId(),
        accessTokenPayload: session.getAccessTokenPayload(),
    });
});

app.get("/getJWT", verifySession(), async (req, res) => {

    let session = req.session;

    let jwt = session.getAccessTokenPayload()["jwt"];

    res.json({ token: jwt })
});

app.use(errorHandler());

app.use((err, req, res, next) => {
    res.status(500).send("Internal error: " + err.message);
});

app.listen(apiPort, () => console.log(`API Server listening on port ${apiPort}`));
