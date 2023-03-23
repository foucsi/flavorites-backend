const mongoose = require("mongoose");

const rncpSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  ID_FICHE: String,
  NUMERO_FICHE: String,
  INTITULE: String,
  ETAT_FICHE: String,
  NOMENCLATURE_EUROPE_NIVEAU: String,
  NOMENCLATURE_EUROPE_INTITULE: String,
  TYPE_EMPLOI_ACCESSIBLES: String,
  CODES_ROME: String,
  LIBELLES_ROME: String,
  CODES_NSF: String,
  INTITULE_NSF: String,
  ACTIVITES_VISEES: String,
  CAPACITES_ATTESTEES: String,
  LIEN_STATISTIQUES: String,
  OBJECTIFS_CONTEXTE: String
});

const Rncp = mongoose.model('rncp', rncpSchema, 'rncp');

module.exports = Rncp;
