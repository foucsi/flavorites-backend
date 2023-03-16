var express = require("express");
var router = express.Router();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;

router.post("/signup", (req, res) => {
  console.log("signup route called");
  if (!checkBody(req.body, ["firstname", "lastname", "password", "email"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        password: hash,
        token: uid2(32),
        profilImg: req.body.profilImg,
      });

      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      res.json({ result: false, error: "User already exists" });
    }
    console.log("je suis dans la route users", req.body.password);
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({
        result: true,
        userID: data._id,
        token: data.token,
        firstname: data.firstname,
        lastname: data.lastname,
        profilImg: data.profilImg,
      });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

router.put("/profilUpdate", (req, res) => {
  console.log(req.body);
  User.findOneAndUpdate(
    { _id: req.body.userId },
    {
      token: req.body.token,
      profilImg: req.body.profilImg,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      user: req.body.newUser,
    }
  ).then((data) => {
    res.json({ result: true, user: data });
  });
});

router.post("/userData", (req, res) => {
  User.findOne({ username: req.body.username }).then((data) => {
    res.json({ result: true, user: data });
  });
});

router.post("/add", (req, res) => {
  User.updateOne(
    { token: req.body.token },
    {
      $push: {
        contents: req.body.contents,
      },
    }
  )
    .then((user) => {
      if (!user) {
        return res.status(404).json({ result: false, error: "User not found" });
      }
      user
        .save()
        .then((savedUser) => {
          res.json({
            result: true,
            title: savedUser.contents[savedUser.contents.length - 1].title,
          });
        })
        .catch((error) => {
          console.error(error);
          res.json({ result: false, error: error.message });
        });
    })
    .catch((error) => {
      console.error(error);
      res.json({ result: false, error: error.message });
    });
});

router.delete("/deleteContent", (req, res) => {
  User.updateOne(
    { username: req.body.username }, // filter to find the right document
    { $pull: { contents: { title: req.body.title } } }, // update using the $pull operator to remove the subdocument
    function (error, result) {
      if (error) {
        return res.status(500).send(error);
      }
      if (result.nModified === 1) {
        return res
          .status(200)
          .send({ message: "Content deleted successfully" });
      } else {
        return res
          .status(401)
          .send({ message: "Error while deleting content" });
      }
    }
  );
});

//récupère toutes les data d'un user
router.post("/all", function (req, res, next) {
  User.find({ username: req.body.username }).then((data) =>
    res.json({ result: true, users: data })
  );
});

router.post("/updateContents", function (req, res, next) {
  //console.log("tentative récupération contentesID",req.body.contentsID)
  User.updateOne(
    { "contents._id": req.body.contentsID },
    {
      $set: {
        "contents.$.title": req.body.title,
        "contents.$.url": req.body.url,
        "contents.$.tags": req.body.tags,
      },
    }
  )
    .then((result) => console.log(result))
    .catch((error) => console.log(error));
});

const cloud_name = process.env.CLOUDINARY_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloud_name,
  api_key: api_key,
  api_secret : api_secret,
});

// Configuration de Multer pour le téléchargement du fichier
const upload = multer({ dest: "tmp/" });

// Route pour télécharger et envoyer l'image sur Cloudinary
router.post("/uploadImage", upload.single("file"), async (req, res) => {
  try {
    // Envoyer l'image sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // Renvoyer l'URL de l'image téléchargée
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Une erreur est survenue lors du téléchargement de l'image.",
      });
  }
});

module.exports = router;
