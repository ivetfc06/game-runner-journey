# RunQuest social: amigos, carreras y cofres reales

## Qué se construye

**1. Cuentas de usuario (Lovable Cloud)**
- Registro con email y contraseña, o con Google.
- Perfil de jugador con nombre, iniciales o avatar, nivel, XP, monedas y racha. Todo queda guardado.

**2. Red social de amigos**
- Buscar corredores por nombre y enviarles una solicitud de amistad.
- Aceptar o rechazar solicitudes, y ver la lista de amigos con su nivel.
- Ranking semanal entre amigos por km y monedas.

**3. Carreras contra amigos (dos modos)**
- **Reto a distancia:** eliges amigo, distancia (1/3/5/10 km) y plazo (24 o 48 h). Cada uno corre cuando quiera y gana el mejor tiempo.
- **En directo:** los dos corren a la vez y cada uno ve en tiempo real la barra de progreso del otro. Gana quien llega antes a la distancia.
- **Premio:** el ganador recibe siempre monedas y XP extra. Además, se puede apostar opcionalmente: cada uno pone la misma cantidad de monedas y el ganador se lo lleva todo. Las monedas quedan reservadas al aceptar el reto y se devuelven si caduca o se cancela.

**4. Cofres del tesoro en lugares reales**
- Mapa con cofres en lugares fijos: parques y monumentos. Al principio habrá una lista inicial en Madrid (Retiro, Templo de Debod, Madrid Río, Casa de Campo, Plaza Mayor…).
- Cada cofre tiene rareza (bronce, plata, oro) y un premio en monedas y XP.
- Durante una carrera con GPS, si pasas a menos de unos 30 m de un cofre, se abre y cobras el premio. Cada cofre vuelve a estar disponible para ti cada 24 h.
- Un panel de administración para que vosotros añadáis o quitéis cofres (nombre, coordenadas, rareza).

**5. Carrera con GPS real**
- La pantalla de carrera usa la ubicación del móvil para medir distancia, tiempo y ritmo, y para detectar cofres.
- Se mantiene el modo simulación para probar sin salir a correr.

## Pantallas

```text
/            Inicio público y botón para entrar
/auth        Entrar / registrarse
/home        HUD del jugador (nivel, monedas, misiones)
/run         Carrera (GPS o simulación), cofres cercanos
/map         Mapa de cofres
/friends     Amigos, solicitudes, ranking
/races       Retos pendientes, activos e historial; crear reto
/races/:id   Detalle / carrera en directo
/admin/chests  Gestión de cofres (solo admin)
```

## Detalles técnicos
- Lovable Cloud: tablas profiles, friendships, races (modo, distancia, apuesta, estado, plazo), race_results, chests (lat/lng, rareza, premio), chest_claims y user_roles (admin). Todas con RLS.
- Monedas, apuestas y apertura de cofres se validan en el servidor para evitar trampas: la distancia al cofre se comprueba con las coordenadas enviadas, y el saldo se mueve en una función SQL transaccional.
- Carreras en directo: Realtime sobre el progreso de cada corredor.
- Mapa: Google Maps (conector) o, como alternativa, OpenStreetMap sin coste.
- Límite honesto: el GPS en navegador solo funciona con la app abierta en pantalla.
