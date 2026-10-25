# Casos de prueba — Listas de precios de unidades

Cada caso sale de una regla del enunciado. El ID aparece en el nombre del test, así se puede rastrear desde el reporte.

## Login

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| AUTH-00 | Pantalla de login | Textos, labels, placeholders, links y "Recordarme" marcado por defecto | `auth/login.cy.ts` |
| AUTH-01 | Credenciales válidas | Toast "Sesión iniciada correctamente!" e ingreso al home | `auth/login.cy.ts` |
| AUTH-02 | Contraseña incorrecta | Mensajes de credenciales incorrectas en ambos campos (no revela cuál falló) | `auth/login.cy.ts` |
| AUTH-03 | Usuario inexistente | Mismos mensajes que AUTH-02 | `auth/login.cy.ts` |
| AUTH-04 | Email con formato inválido | "El correo electrónico debe ser valido." | `auth/login.cy.ts` |
| AUTH-05 | Campos vacíos | Mensajes de campo obligatorio en email y contraseña | `auth/login.cy.ts` |
| AUTH-06 | Login **con** "Recordarme" y reapertura del navegador | La sesión se mantiene | `auth/login.cy.ts` |

Los mensajes esperados de AUTH-02 a AUTH-05 están en `fixtures/login-negative.json` y el wording de AUTH-00 en `fixtures/login-texts.json`.

## Registro

> Todo el flujo corre contra la app real. REG-08 y REG-09 crean una organización por test, con email único (`qa.auto.registro+<timestamp>@lebane.test`).

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| REG-01 | Link "Registrarme" desde el login | Navega a `/sign-up` | `auth/registro.cy.ts` |
| REG-02 | Pantalla de registro | Textos, labels, placeholders, botón y link "Ingresar" | `auth/registro.cy.ts` |
| REG-03 | Selector de país | Argentina, España, México, Paraguay, Uruguay | `auth/registro.cy.ts` |
| REG-04 | Enviar vacío | Los 4 mensajes de campo obligatorio | `auth/registro.cy.ts` |
| REG-05 | Email con formato inválido | "El correo electrónico debe ser valido." | `auth/registro.cy.ts` |
| REG-06 | Letras en el teléfono | El campo no las acepta | `auth/registro.cy.ts` |
| REG-07 | Link "Ingresar" | Vuelve a `/sign-in` | `auth/registro.cy.ts` |
| REG-08 | Registro con datos válidos | El alta responde 2xx y se muestra "Email de confirmación enviado" con el correo ingresado | `auth/registro.cy.ts` |
| REG-09 | Link "Iniciar sesión" en la confirmación | Vuelve a `/sign-in` | `auth/registro.cy.ts` |
| REG-10 | Registro con un correo ya existente (backend real) | Toast "Ya existe una cuenta con ese correo electrónico" y sigue en el formulario | `auth/registro.cy.ts` |

## Recuperar contraseña

> Se usa siempre un email inexistente: con el de la cuenta de prueba se le resetearía la contraseña y fallaría el resto de la suite.

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| REC-01 | Link "Recuperar contraseña" desde el login | Navega a `/recuperar-contrasena` | `auth/recuperar-contrasena.cy.ts` |
| REC-02 | Pantalla de recuperación | Textos, label, placeholder y botón "Confirmar" | `auth/recuperar-contrasena.cy.ts` |
| REC-03 | Confirmar vacío | "El correo electrónico es obligatorio." y no se envía la solicitud | `auth/recuperar-contrasena.cy.ts` |
| REC-04 | Email con formato inválido | "El correo electrónico debe ser valido." y no se envía la solicitud | `auth/recuperar-contrasena.cy.ts` |
| REC-05 | Email no registrado | No se confirma el reseteo: la app informa que el correo no está registrado. **Hoy falla (bug)** | `auth/recuperar-contrasena.cy.ts` |

## Logout

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| AUTH-08 | Cerrar sesión desde el menú del avatar | Vuelve a `/sign-in` y se eliminan los tokens | `auth/logout.cy.ts` |
| AUTH-09 | Acceder a una ruta privada después del logout | Redirige a `/sign-in` | `auth/logout.cy.ts` |

## Creación de proyecto

> Regla: *al crear un proyecto se crea una lista de precios inicial, que puede o no especificar el nombre.*

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| LP-01 | Crear proyecto **con** nombre de lista | Existe una única lista, con ese nombre | `proyectos/crear-proyecto.cy.ts` |
| LP-02 | Crear proyecto **sin** nombre de lista | Existe una única lista con nombre por defecto `Lista precios dd/mm/yyyy` | `proyectos/crear-proyecto.cy.ts` |
| LP-10 | Formulario sin campos obligatorios | El botón *Registrar* está deshabilitado | `proyectos/crear-proyecto.cy.ts` |
| LP-12 | Nombre del proyecto compuesto solo por espacios | El botón *Registrar* está deshabilitado | `proyectos/crear-proyecto.cy.ts` |

> En la app, el nombre de la lista inicial se define en "Actualizar datos del proyecto", la primera vez que se entra a Unidades.

## Formulario de proyecto: validaciones de inputs

> Spec aparte (`npm run test:validaciones`). No crea proyectos. Datos en `fixtures/project-form.json`.

| ID | Caso | Resultado esperado | Estado |
|---|---|---|---|
| PF-01 | Valor inexistente en Moneda, País, Estado, Ciudad, Jurisdicción, Tipo de construcción y Modalidad de ajuste | "No se encontraron opciones disponibles" | ✅ |
| PF-02 | Cascada País → Estado → Ciudad | Estado y Ciudad deshabilitados hasta elegir el campo anterior | ✅ |
| PF-03 | Cambiar el Estado | Se limpia la Ciudad | ✅ |
| PF-04 | AR, ES, MX, PY y UY | Cada país carga sus propios estados | ✅ |
| PF-05 | Tipo de cambio manual en 0, con letras o vacío | "El tipo de cambio debe ser mayor a 0." y Registrar deshabilitado | ✅ |
| PF-06 | Tipo de cambio manual válido (1500) | Se muestra "1.500" y Registrar sigue habilitado | ✅ |
| PF-07 | Tipo de cambio fuera de rango | Registrar deshabilitado | ❌ Bug |
| PF-08 | Finalización anterior al inicio | Registrar deshabilitado | ❌ Bug |
| PF-09 | Inicio en el pasado | Registrar deshabilitado | ❌ Bug |
| PF-10 | Inicio y fin ya transcurridos | Registrar deshabilitado | ❌ Bug |
| PF-11 | Fecha incompleta | Registrar deshabilitado | ❌ Bug |
| PF-12 | Fecha anterior a 1900 | Registrar deshabilitado | ❌ Bug |
| PF-13 | Número de dirección alfanumérico ("123B") | Se acepta | ✅ |
| PF-14 | Número de documento alfanumérico ("12345678Z") | Se acepta | ✅ |
| PF-15 | Crear razón social nueva | Pide Nombre, Descripción, Fecha de registro, Tipo y Número de documento. Registrar se habilita al completarlos | ✅ |
| PF-16 | Nombre de proyecto existente | Toast "Ya existe un proyecto con el nombre "X" en la organización." | ✅ |

Última corrida: 28 tests (PF-01, PF-04 y PF-05 se repiten por campo, país o valor). Pasan 22. Fallan 6 (PF-07 a PF-12), todos porque Registrar sigue habilitado con el dato inválido.

## Unidades

> Regla: *se pueden crear unidades manualmente o con un template. Modificar el precio modifica la lista; cargar un template crea una nueva lista.*

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| LP-03 | Crear unidad manual | La unidad aparece en la lista actual y persiste al recargar | `unidades/unidades.cy.ts` |
| LP-04 | Modificar el precio de una unidad | El precio se actualiza en la **misma** lista; no aparece una lista nueva | `unidades/unidades.cy.ts` |
| LP-05 | Cargar template `.xlsx` | Se crea **una** lista nueva con las unidades del template | `unidades/template.cy.ts` |
| LP-11 | Cargar archivo con formato inválido | Se muestra un error y no se crea ninguna lista | `unidades/template.cy.ts` |

## Quitar unidades (tacho rojo)

> Regla: *si la lista queda vacía se elimina. Si la unidad queda sin lista se elimina la unidad.*

| ID | Caso | Resultado esperado | Spec |
|---|---|---|---|
| LP-06 | Quitar una unidad de una lista con varias | Sale la unidad y la lista sigue existiendo | `listas-precios/eliminar-unidad.cy.ts` |
| LP-07 | Quitar la única unidad (o todas) de una lista | La lista se elimina | `listas-precios/eliminar-unidad.cy.ts` |
| LP-08 | Quitar una unidad que estaba en una sola lista | La unidad no existe en ninguna lista | `listas-precios/eliminar-unidad.cy.ts` |
| LP-09 | Quitar de una lista una unidad que está en dos | La unidad sigue existiendo en la otra lista | **No automatizado:** bloqueado por KAN-12 (el template no crea una segunda lista). Contracara de LP-08, no es una regla explícita del enunciado. |
