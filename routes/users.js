var express = require("express");
var router = express.Router();

let jwt = require("jsonwebtoken");

const personaC = require("../app/controls/PersonaControl"); //Primero cargamos el archivo
let PersonaControl = new personaC(); //Luego creamos el "objeto"

const rolC = require("../app/controls/RolControl"); //Primero cargamos el archivo
let rolControl = new rolC();

const animeC = require("../app/controls/AnimeControl"); //Primero cargamos el archivo
let animeControl = new animeC();

const comentarioC = require("../app/controls/ComentarioControl"); //Primero cargamos el archivo
let comentarioControl = new comentarioC();

const cuentaC = require("../app/controls/CuentraControl"); //Primero cargamos el archivo
let cuentaControl = new cuentaC();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("HOLA MUNDO");
});

//middleware
const auth = function middleware(rolesPermitidos) {
  return async function (req, res, next) {
    const token = req.headers["anime-token"];

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
          const rol = models.rol;
          const aux = await cuenta.findOne({
            where: { external_id: decoded.external },
            include: [
              {
                model: models.persona,
                as: "persona",
                attributes: ["apellidos", "nombres", "id_rol"],
              },
            ],
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
            const rolAux = await rol.findOne({
              where: { id: aux.persona.id_rol },
            });
            if (rolesPermitidos.includes(rolAux.nombre)) {
              next();
            } else {
              res.status(403);
              res.json({
                msg: "ERROR",
                tag:
                  "Acceso no autorizado, se requiere uno de los roles: " +
                  rolesPermitidos.join(", "),
                code: 403,
              });
            }
          }
        }
      });
    }
  };
};

const authAdmin = auth("admin");
const authGlobal = auth(["admin", "editor", "usuario"]);
const authAdminEditor = auth(["admin", "editor"]);

//inicio sesion
router.post("/login", cuentaControl.inicio_sesion);

//api de personas
router.get("/admin/personas", authAdmin, PersonaControl.listar);
router.get("/admin/personas/get/:external", authGlobal, PersonaControl.obtener);
router.post("/admin/persona/save", authAdmin, PersonaControl.guardar);
router.post("/admin/persona/usuario/save", PersonaControl.guardarUsuario);
router.put(
  "/admin/personas/modificar/:external",
  authAdmin,
  PersonaControl.modificar
);
router.put(
  "/admin/personas/banear/:external",
  authAdmin,
  PersonaControl.banearUsuario
);

router.put(
  "/personas/modificar/usuario/:external",
  authGlobal,
  PersonaControl.modificarUsuario
);

//api de rol
router.get("/admin/rol",authAdmin, rolControl.listar);
router.post("/admin/rol/save",authAdmin, rolControl.guardar);
//api de anime
router.get("/animes", authGlobal, animeControl.listar);
router.get("/animes/get/:external", authGlobal, animeControl.obtener);
router.post("/admin/animes/save", authAdminEditor, animeControl.guardar);
router.put(
  "/admin/animes/modificar/:external",
  authAdminEditor,
  animeControl.modificar
);
router.use("/images", express.static("public/images"));
router.post("/admin/animes/file/save/:external", animeControl.guardarFoto);
//API DE COMENTARIO
router.get("/comentarios", authGlobal, comentarioControl.listar);
router.get("/comentarios/get/:external", authGlobal, comentarioControl.obtener);
router.post("/comentarios/save", authGlobal, comentarioControl.guardar);
router.put(
  "/admin/comentarios/modificar/:external",
  authAdmin,
  comentarioControl.modificar
);
router.put(
  "/comentarios/modificar/:external",
  authGlobal,
  comentarioControl.modificarComentarioUsuario
);

module.exports = router;
