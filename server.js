require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const db = require("./db");

const app = express();

// Permite que Express reconozca el HTTPS de Railway.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "clave-local-solo-para-demostracion",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000
  }
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  next();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "'"
  }[character]));
}

function showMessage(res, title, message, status = 400) {
  return res.status(status).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · AulaClave</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="panel narrow">
    <div class="brand-mark">A</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p><a href="/clave">Volver a intentarlo</a></p>
    <p><a href="/">Volver al inicio</a></p>
  </main>
</body>
</html>`);
}

app.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/cuenta");
  }

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/clave", (req, res) => {
  if (!req.session.pendingEmail) {
    return res.redirect("/");
  }

  res.sendFile(path.join(__dirname, "public", "password.html"));
});

// GARANTIZADO: Cero Expresiones Regulares. Validación lógica directa.
app.post("/continuar", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  // 1. Validamos longitud básica
  if (!email || email.length > 190 || email.length < 5) {
    return showMessage(res, "Correo no válido", "Introduce un correo electrónico válido.");
  }

  // 2. Comprobamos que tenga una estructura básica de correo: un '@' y al menos un '.'
  if (!email.includes("@") || !email.includes(".")) {
    return showMessage(res, "Correo no válido", "Introduce un correo electrónico válido.");
  }

  // 3. Separamos para verificar que haya texto después del punto
  const partes = email.split(".");
  const extension = partes[partes.length - 1];
  if (extension.length < 2) {
    return showMessage(res, "Correo no válido", "Introduce un correo electrónico válido.");
  }

  req.session.pendingEmail = email;
  res.redirect("/clave");
});

// REGISTRO: Guarda en texto plano de forma correcta
app.post("/registro", async (req, res) => {
  const email = String(req.session.pendingEmail || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email) {
    return res.redirect("/");
  }

  if (password.length < 8 || password.length > 128) {
    return showMessage(
      res,
      "Contraseña no válida",
      "La contraseña debe tener entre 8 y 128 caracteres."
    );
  }

  try {
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return showMessage(
        res,
        "La cuenta ya existe",
        "Ese correo ya está registrado. Usa Iniciar sesión."
      );
    }

    const [result] = await db.execute(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, password]
    );

    req.session.userId = result.insertId;
    req.session.email = email;
    delete req.session.pendingEmail;

    res.redirect("/cuenta");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return showMessage(
        res,
        "La cuenta ya existe",
        "Ese correo ya está registrado. Inicia sesión."
      );
    }

    console.error("Error al registrar usuario:", error.message);
    return showMessage(
      res,
      "Error de registro",
      "No se pudo guardar la cuenta. Revisa la conexión con MySQL.",
      500
    );
  }
});

// INICIO DE SESIÓN CORREGIDO (Extracción correcta de la primera fila)
app.post("/login", async (req, res) => {
  const email = String(req.session.pendingEmail || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.redirect("/");
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, email, password FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    const user = rows[0]; 

    // Comparamos el texto plano ingresado con la columna 'password'
    if (!user || password !== user.password) {
      return showMessage(
        res,
        "No se pudo iniciar sesión",
        "Comprueba el correo y la contraseña de tu cuenta de AulaClave.",
        401
      );
    }

    req.session.userId = user.id;
    req.session.email = user.email;
    delete req.session.pendingEmail;

    res.redirect("/cuenta");
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    return showMessage(
      res,
      "Error de conexión",
      "No se pudo consultar la base de datos.",
      500
    );
  }
});

app.get("/cuenta", requireLogin, (req, res) => {
  res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mi cuenta · AulaClave</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="panel narrow">
    <div class="logo" aria-label="AulaClave"></div>
    <h1>Sesión iniciada</h1>
    <p>Tu cuenta ha sido verificada.</p>
    <div class="account-box">
      <span>Correo verificado</span>
      <strong>${escapeHtml(req.session.email)}</strong>
    </div>
    <form action="/logout" method="post">
      <button class="primary" type="submit">Salir</button>
    </form>  </main>
</body>
</html>`);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, database: "disconnected" });
  }
});

const port = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    console.log("Tabla users verificada correctamente.");

    app.listen(port, () => {
      console.log(`AulaClave activo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Error al conectar con MySQL o preparar la tabla users:",
      error.message
    );
    process.exit(1);
  }
}

startServer();