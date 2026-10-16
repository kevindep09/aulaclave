require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function main() {
  const email = String(process.argv[2] || "").trim().toLowerCase();
  const password = String(process.argv[3] || "");
  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('Uso: npm run crear-usuario -- alumno@ejemplo.com "ClaveDemo123!"');
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Para esta demo, usa una contraseña de al menos 8 caracteres.");
    process.exitCode = 1;
    return;
  }
 
try {
    // Ya no usamos bcrypt.hash porque queremos guardar la contraseña real
    await db.execute("INSERT INTO users (email, password) VALUES (?, ?)", [email, password]);
    console.log(`Usuario de prueba creado: ${email}`);


  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.error("Ya existe una cuenta con ese correo.");
      process.exitCode = 1;
    } else {
      console.error("No se pudo crear el usuario:", err.message);
      process.exitCode = 1;
    }
  } finally {
    await db.end();
  }
}
main();
