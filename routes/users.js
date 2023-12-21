var express = require("express");
var router = express.Router();

let jwt = require("jsonwebtoken");

const personaC = require("../app/controls/PersonaControl"); //Primero cargamos el archivo
let PersonaControl = new personaC(); //Luego creamos el "objeto"

const rolC = require("../app/controls/RolControl"); //Primero cargamos el archivo
let rolControl = new rolC();

const animeC = require("../app/controls/AnimeControl"); //Primero cargamos el archivo
let animeControl = new animeC();

const cuentaC = require("../app/controls/CuentraControl"); //Primero cargamos el archivo
let cuentaControl = new cuentaC();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("HOLA MUNDO");
});

//middleware
const auth = function middleware(req, res, next) {
  const token = req.headers["puta-key"];

  console.log(req.headers);

  if (token === undefined) {
    res.status(401);
    res.json({
      msg: "ERROR",
      tag: "Falta token",
      code: 401,
    });
  } else {
    require("dotenv").config();
    const key = process.env.KEY_JWT;
    jwt.verify(token, key, async (err, decoded) => {
      if (err) {
        res.status(401);
        res.json({
          msg: "ERROR",
          tag: "Token no valido o expirado",
          code: 401,
        });
      } else {
        console.log(decoded.external);
        const models = require("../app/models");
        const cuenta = models.cuenta;
        const aux = await cuenta.findOne({
          where: { external_id: decoded.external },
        });
        if (aux === null) {
          res.status(401);
          res.json({
            msg: "ERROR",
            tag: "Token no valido",
            code: 401,
          });
        } else {
          //TODO Autorizacion
          next();
        }

      }
    });
  }
  // console.log(req.url);
  // console.log(token);
  // next();
};

//inicio sesion
router.post("/login", cuentaControl.inicio_sesion);

//api de personas
router.get("/admin/personas", auth, PersonaControl.listar);
router.get("/admin/personas/get/:external", PersonaControl.obtener);
router.post("/admin/persona/save", PersonaControl.guardar);
router.put("/admin/personas/modificar/:external", PersonaControl.modificar);
//api de rol
router.get("/admin/rol", rolControl.listar);
router.post("/admin/rol/save", rolControl.guardar);
//api de rol
router.get("/animes", animeControl.listar);
router.get("/animes/get/:external", animeControl.obtener);
router.post("/admin/animes/save", animeControl.guardar);
router.put("/admin/animes/modificar/:external", animeControl.modificar);
//router.post("/admin/animes/file/save", animeControl.guardarFoto);
router.put("/admin/animes/file/save/:externalA", animeControl.guardarFoto);
module.exports = router;
