# QA Automation — Listas de precios de unidades (Lebane)

Suite E2E en **Cypress 16 + TypeScript** para la funcionalidad de listas de precios de unidades en `https://tst.lebane.app`.

## Requisitos

- Node.js 20+
- Credenciales del ambiente de testing

## Instalación

```bash
npm install
cp cypress.env.example.json cypress.env.json   # completar USER_EMAIL y USER_PASSWORD
```

`cypress.env.json` está en `.gitignore`, así que las credenciales nunca se suben al repo. En CI se toman de los secrets `USER_EMAIL` y `USER_PASSWORD`.

No hace falta preparar archivos a mano. Los tests completan el template oficial (`cypress/fixtures/templates/template_unidades.xlsx`, descargado desde la app) con unidades de nombre único mediante un `cy.task` con `exceljs`. Las imágenes del logo del proyecto (`logo-proyecto.png` y `logo-invalido.pdf`) están en `cypress/fixtures/images/`.

## Ejecución

| Comando | Qué hace |
|---|---|
| `npm run cy:open` | Abre el runner interactivo |
| `npm test` | Corre toda la suite headless en Electron |
| `npm run test:smoke` | Solo los flujos de negocio: auth, creación de proyecto, unidades y listas de precios |
| `npm run test:validaciones` | Solo las validaciones de inputs del formulario de proyecto |
| `npx cypress run --spec cypress/e2e/auth/login.cy.ts` | Corre un solo spec |
| `npm run typecheck` | Chequeo de tipos con `tsc` |

El reporte HTML queda en `cypress/reports/index.html`, con los screenshots de los fallos embebidos.

> Si Cypress falla con `bad option: --smoke-test` al ejecutarse desde la terminal de VS Code, eliminá la variable `ELECTRON_RUN_AS_NODE` de la sesión. VS Code la hereda a sus terminales.

## Estructura

```
cypress/
├── e2e/                 # specs agrupados por funcionalidad (IDs de casos en cada test)
├── pages/               # Page Objects: selectores privados + acciones por pantalla
├── factories/           # datos de prueba dinámicos (nombres únicos por corrida)
├── fixtures/            # datos estáticos: casos negativos de login, template oficial, imágenes del logo
├── tasks/               # tareas de Node (generación del .xlsx de unidades)
└── support/             # comandos custom (login con sesión, crear/preparar proyecto) y tipos
docs/casos-de-prueba.md  # diseño de casos: regla del enunciado → caso → spec
```

## Decisiones

- **Page Object Model con selectores privados.** Cada pantalla tiene su página y los specs no conocen selectores. Prioricé atributos estables de la app (`data-cy`, `data-table-id`, `data-column-id`, `name`) y texto visible cuando no había otra opción.
- **Login con `cy.session`.** Solo `login.cy.ts` prueba el login por UI; el resto restaura la sesión cacheada.
- **Credenciales con `cy.env`.** Es la API de Cypress 16 para secretos: no se exponen al navegador ni quedan en el log.
- **Tests independientes.** Cada test que depende del estado de las listas crea su propio proyecto con nombre único. El ambiente es compartido y así no hay acoplamiento entre corridas ni dependencia del orden.
- **Sin esperas fijas.** La tabla de unidades se sincroniza con `cy.intercept` sobre `GET /v2/proyectos/:id/unidades`; el resto usa aserciones con reintento, nunca `cy.wait(ms)`.
- **Datos de template generados.** Cada test arma su propio `.xlsx` desde el template oficial, con nombres únicos.
- **Registro end-to-end real.** REG-08 y REG-09 dan de alta organizaciones reales con email único por corrida. `cy.intercept` solo se usa como espía para verificar el código de respuesta, nunca para simular el backend.
- **Happy path separado de las validaciones.** Los flujos del enunciado (`test:smoke`) y las validaciones de inputs (`test:validaciones`) están en specs distintos. Un bug de validación no tapa el estado del flujo principal, y las validaciones no crean proyectos. Se separan por spec y no con tags porque `@cypress/grep` depende de `Cypress.env()`, que ya no existe en Cypress 16.
- **Criterios definidos con negocio.** Antes de automatizar cada validación se exploró el comportamiento real y se acordó el resultado esperado. Lo que se definió como bug queda como test que falla hasta que se corrija.
- **Casos negativos data-driven.** Los casos de login inválido salen de `fixtures/login-negative.json`.

## Flujo real de la app

1. *Agregar proyecto* → formulario en `/primer-proyecto` → *Registrar* (toast "Creación exitosa").
   - **Logo del proyecto:** el input acepta `.jpg`, `.jpeg` y `.png`. Al elegir el archivo solo se muestra la vista previa; la imagen se sube después de crear el proyecto, con `PATCH /proyect/{id}/update-logo`. Todos los proyectos que crea la suite llevan logo y `createProject` valida esa subida. Un archivo con otro formato se rechaza con un mensaje debajo del recuadro (PF-17).
2. La primera vez que se entra a *Unidades* aparece **"Actualizar datos del proyecto"**. Ahí se completan precio M2, pisos, tipologías y unidades por piso, y **ahí se define el nombre opcional de la lista de precios inicial** (`versionListaPrecios`). Con 1 piso × 1 unidad, la app genera la unidad `101`.
3. El tacho abre el diálogo *Eliminar unidad*, que anticipa si la lista quedará vacía y si la unidad se borrará.

## Supuestos

- **LP-09:** una unidad presente en dos listas debería seguir existiendo al quitarla de una. Es la contracara de LP-08, no una regla explícita del enunciado.
- **Nombre de la lista del template:** cargar un template siempre genera la lista "Lista precios DD/MM/AAAA" con la fecha del día. Si ya existe una lista con ese nombre (la inicial sin nombre propio, o un template cargado ese mismo día), la app suma las unidades a esa lista en vez de crear otra. Por eso LP-05 y LP-09 crean el proyecto con una lista inicial con nombre propio. Queda por validar con negocio si dos cargas del mismo día deberían generar listas distintas.
- **Unidades repetidas en el template:** una unidad del template con un número que ya existe se asocia a esa unidad (mismo id) y no se duplica.

## Observaciones sobre la app

- El enunciado indica que la lista de precios inicial se nombra *al crear el proyecto*. En la app, el nombre se define en el paso "Actualizar datos del proyecto", al entrar por primera vez a Unidades.
- El enunciado indica el camino *Comercial → Unidades* (Fig. 4), pero en el ambiente de testing la opción está en *Clientes → Unidades* (`/proyecto/:id/areas`).
- **Bugs del formulario de proyecto (PF-07 a PF-12):**
  - **Tipo de cambio** fuera de rango (`99999999999999999999`): lo acepta y lo redondea a `100.000.000.000.000.020.000`. No es un valor real de tipo de cambio.
  - **Fechas:** acepta una finalización anterior al inicio, un inicio en el pasado, un período ya transcurrido, fechas incompletas (`15/10/YYYY`) y fechas anteriores a 1900. Por ejemplo, tipear en formato mm/dd genera `12/03/0006`.
- **Mejora (sin test):** Nombre, Dirección y Número de dirección no tienen límite de caracteres (aceptan 300 o más). Si la API los acepta es porque la base está preparada; igual convendría un `maxlength` acorde.
- **Criterios aceptados (no son bugs):** el número de dirección y el número de documento aceptan valores alfanuméricos ("123B", "12345678Z") porque hay países que los usan, como Colombia y España. Se unifica para todos (PF-13 y PF-14). El input de razón social muestra `Crear nueva razón social "X"` al crear una nueva, y es el comportamiento esperado.
- **Posible bug (LP-12):** el botón *Registrar* se habilita aunque el nombre del proyecto tenga solo espacios.
- **Posible bug:** "Recordarme" no tiene efecto observable. Con o sin el check, los tokens se guardan en `localStorage` y la sesión sigue activa al reabrir el navegador. Tampoco precarga el email después del logout. A validar con negocio cuál es el comportamiento esperado.
- **Bug (REC-05): recuperar contraseña no valida que el email exista.** Con un correo no registrado, el backend responde `400` en `POST /users/reset-password`, pero la UI muestra igual "Se reseteo la contraseña verifique el email", en un toast de error. El usuario cree que el reseteo se hizo cuando no pasó nada. Si negocio prefiere no revelar qué cuentas existen (*user enumeration*), el mensaje debería ser neutro ("Si el correo está registrado, te enviaremos las instrucciones") y no afirmar un reseteo. A "reseteo" además le falta la tilde (*reseteó*).
- **Borrado masivo con wording variable:** seleccionando todas las unidades, el modal "Eliminar elementos" muestra textos distintos según el caso. Con 2 y 3 unidades pregunta "¿Estás seguro de querer eliminar los elementos seleccionados (N)?", sin advertencia. Con 4 unidades se vio "¿Estás seguro de querer eliminar todos los elementos (4)?" más la advertencia "Se eliminarán todos los elementos. Esta acción no se puede deshacer.". La regla no está confirmada; a validar con negocio. En el listado, además, la tipología aparece como "Tipologa 14" (sin tilde y con lo que parece un ID en lugar del nombre), y el mensaje final dice "con exito" sin tilde.
- **Logo sin navegación:** en el login, hacer clic en el ícono de Lebane del encabezado no redirige al home. Es una imagen sin link (`<img alt="Logo">`), cuando lo esperable es que el logo lleve a la página principal.
- **Recuperar contraseña sin salida:** la pantalla no tiene link para volver al login. Además, su formulario reutiliza `name="loginForm"`.
- **Wording en registro:** el subtítulo pide "correo electrónico y contraseña", pero el formulario no tiene campo de contraseña. Además, el botón de alta dice "Ingresar a Lebane" en una pantalla titulada "Registrarme en Lebane".
- **Wording:** el mensaje de email inválido (login y registro) dice "debe ser valido" (falta la tilde: *válido*). AUTH-04 valida el texto actual para no mezclar un detalle cosmético con la funcionalidad.

## Mejoras con más tiempo

- Crear proyectos por API (`cy.request`) en los `beforeEach` para bajar el tiempo de la suite. Dejaría la creación por UI solo en LP-01 y LP-02.
- Limpiar los proyectos y organizaciones creados al final de cada corrida.
