# AulaClave Login con MySQL

Proyecto educativo con Node.js, Express, MySQL, sesiones y verificación de contraseñas con bcrypt. Usa una marca propia y credenciales de prueba; no es un acceso a Google ni debe usarse para recoger contraseñas de terceros.

## Requisitos
- Node.js 18+
- MySQL Server y MySQL Workbench 8.0
- Visual Studio Code

## 1. Crear la base de datos
1. Abre MySQL Workbench y conéctate a tu servidor local.
2. Abre `schema.sql`.
3. Pulsa el icono del rayo para ejecutar el script. Creará la base `aulaclave` y la tabla `users`.

## 2. Configurar el proyecto
1. Abre esta carpeta en VS Code.
2. En la terminal ejecuta `npm install`.
3. Copia `.env.example` y ponle el nombre `.env`.
4. Edita `.env` y escribe la contraseña real de tu usuario local de MySQL en `DB_PASSWORD`. No compartas el archivo `.env`.

## 3. Crear una cuenta de prueba
En la terminal, ejecuta:
`npm run crear-usuario -- alumno@ejemplo.com "ClaveDemo123!"`

Puedes cambiar el correo y la contraseña por valores de prueba propios. El hash se almacena en MySQL; la contraseña original no se guarda.

## 4. Ejecutar y probar
Ejecuta `npm start` y abre `http://localhost:3000`.
Ingresa el correo y la contraseña que acabas de crear. Si los datos coinciden, te llevará a la página de cuenta. Pulsa “Cerrar sesión” para salir.

## Archivos
- `schema.sql`: crea base de datos y tabla.
- `db.js`: conexión a MySQL.
- `server.js`: rutas y sesión.
- `crear-usuario.js`: crea cuentas de prueba.
- `public/`: pantallas y estilos.

## Subida a internet
Para publicar la demo necesitas un servicio que ejecute Node.js y una base MySQL accesible desde ese servicio. Configura las variables de entorno en el panel del proveedor, usa HTTPS y una clave de sesión aleatoria; no subas `.env` ni contraseñas al repositorio. En alojamiento compartido, confirma que permita Node.js y conexiones a MySQL. Esta versión es una base didáctica, no una configuración endurecida para producción.
