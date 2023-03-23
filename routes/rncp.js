var express = require("express");
var router = express.Router();

const Rncp = require("../models/rncp");

router.get('/all', async (req, res) => {
  try {
    const fiches = await Rncp.find();
    res.json(fiches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/search', async (req, res) => {
  Rncp.findOne({ NUMERO_FICHE: req.body.search }).then((data) => {
    res.json({ result: true, resultat: data });
  });
});

router.get('/ficheAll', async (req, res) => {
  Rncp.find().then((data) => {
    res.json({ result: true, resultat: data });
  });
});

module.exports = router; // N'oubliez pas d'exporter le routeur
