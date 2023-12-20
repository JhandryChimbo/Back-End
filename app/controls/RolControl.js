"use strict";
var models = require("../models");
var rol = models.rol;
class RolControl {
  async listar(req, res) {
    var lista = await rol.findAll({
      attributes: ["nombre", ["external_id", "id"]],
    });
    res.status(200);
    res.json({ msg: "OK", code: 200, datos: lista });
  }

  async guardar(req, res) {
    if (req.body.hasOwnProperty("nombre")) {
      var uuid = require("uuid");
      var data = {
        nombre: req.body.nombre,
        external_id: uuid.v4(),
      };
      var result = await rol.create(data);
      if (result === null) {
        res.status(401);
        res.json({ msg: "OKdnt", tag: "no se puede crear", code: 401 });
      } else {
        res.status(200);
        res.json({ msg: "OK", code: 200 });
      }
    } else {
      res.status(400);
      res.json({ msg: "OKdnt", tag: "Faltan datos", code: 400 });
    }
  }
}

module.exports = RolControl;
