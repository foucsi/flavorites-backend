var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

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
        role: "Jury",
        phoneNumber: "",
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
        role: data.role,
        phoneNumber: data.phoneNumber,
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


router.put("/uploadProfilImg/:token", upload.single("image"), async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    // Delete image from cloudinary
    await cloudinary.uploader.destroy(user.cloudinary_id);
    // Upload image to cloudinary
    let result;
    if (req.file) {
      result = await cloudinary.uploader.upload(req.file.path);
    }
    const data = {
      avatar: result?.secure_url || user.avatar,
      cloudinary_id: result?.public_id || user.cloudinary_id,
    };
    user = await User.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});
router.get("/photoUser/:token", async (req, res) => {
  const token = req.params.token;
  const user = await User.findOne({ token });
  if (user) {
    res.json({ result: true, profilePicture: user.photo });
  } else {
    res.json({ result: false, error: "User has no profile picture" });
  }
});

module.exports = router;
