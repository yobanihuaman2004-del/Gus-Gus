<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gus Gus - Iniciar Sesión</title>
  <!-- SEO Básico -->
  <meta name="description" content="Inicia sesión en Gus Gus. Compra y vende tus productos con total seguridad.">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    body {
      background-color: #f4f6f8;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      padding: 30px 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .card h1 {
      color: #1a2a3a;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 25px;
      line-height: 1.4;
    }
    .form-group {
      text-align: left;
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      border-color: #4CAF50;
    }
    .btn-submit {
      width: 100%;
      padding: 14px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
      transition: background-color 0.2s;
    }
    .btn-submit:hover {
      background-color: #45a049;
    }
    .footer-text {
      margin-top: 20px;
      font-size: 13px;
      color: #777;
    }
    .footer-text a {
      color: #4CAF50;
      text-decoration: none;
      font-weight: bold;
    }
    #mensaje {
      margin-top: 15px;
      font-size: 14px;
      font-weight: 600;
    }
    .error { color: #d9534f; }
    .exito { color: #5cb85c; }
  </style>
</head>
<body>

  <div class="card">
    <h1>Gus Gus</h1>
    <p>Ingresa a tu cuenta para operar con la seguridad de nuestra plataforma intermediaria.</p>

    <form id="loginForm">
      <div class="form-group">
        <label for="email">Correo Electrónico:</label>
        <input type="email" id="email" placeholder="tu@correo.com" required>
      </div>

      <div class="form-group">
        <label for="dni">Número de DNI:</label>
        <input type="text" id="dni" placeholder="Ingresa tus 8 dígitos" maxlength="8" pattern="[0-9]{8}" required>
      </div>

      <div class="form-group">
        <label for="password">Contraseña:</label>
        <input type="password" id="password" placeholder="••••••••" required>
      </div>

      <button type="submit" class="btn-submit">Ingresar a Gus Gus</button>
    </form>

    <div id="mensaje"></div>

    <div class="footer-text">
      ¿No tienes una cuenta? <a href="#">Regístrate aquí</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const mensajeDiv = document.getElementById('mensaje');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      mensajeDiv.textContent = "Verificando...";
      mensajeDiv.className = "";

      const email = document.getElementById('email').value;
      const dni = document.getElementById('dni').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, dni, password })
        });

        const data = await response.json();

        if (response.ok) {
          mensajeDiv.textContent = "¡Inicio de sesión exitoso!";
          mensajeDiv.className = "exito";
        } else {
          mensajeDiv.textContent = data.error || "Error al iniciar sesión";
          mensajeDiv.className = "error";
        }
      } catch (err) {
        mensajeDiv.textContent = "No se pudo conectar con el servidor.";
        mensajeDiv.className = "error";
      }
    });
  </script>

</body>
</html>      
