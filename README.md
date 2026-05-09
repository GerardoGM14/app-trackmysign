# TrackMySign

> ERP web multi-tenant para talleres de imprenta y rotulación. Cubre el ciclo de venta completo — **Cotización → Orden → Producción → Aprobación de pruebas → Entrega** — con cuatro roles diferenciados y un sistema de proofing con firma digital.

Construido con React 19, TypeScript, Vite 7 y TailwindCSS 4. Diseño sobrio sin sombras ni degradados, paleta `slate` + acento `#1e40af`.

---

## Roles y vistas

| Rol | Vistas principales |
|---|---|
| **Super Admin** | Dashboard global · Tenants · Analytics · Usuarios · Configuración |
| **Admin** | Resumen · Cotizaciones · Órdenes (Kanban) · Documentos · Empleados · Reportes · Configuración |
| **Employee** | Resumen · Pendientes · Cotizaciones · Órdenes (Kanban filtrado) · Mis documentos · Actividad · Mi cuenta |
| **Customer** | Resumen · Mis cotizaciones · Mis órdenes (con tracking) · Pruebas · Mi cuenta |

---

## Funcionalidades destacadas

- **Cotizaciones con calculadora en vivo** — precio por m² según material, IGV configurable, totales reactivos
- **Kanban drag&drop de órdenes** (`@dnd-kit`) — 5 columnas: Pendiente, Diseño, Producción, Lista, Entregada
- **Sistema de proofing end-to-end** — el taller envía pruebas con notas, el cliente las aprueba firmando o las rechaza con motivo
- **Firma digital reutilizable** (`react-signature-canvas`) — modo dibujo o tipográfico, con aceptación legal
- **Tracking visual del cliente** — timeline de 5 pasos por orden, anillo de progreso animado
- **Exportación Excel** (`exceljs`) de cotizaciones y órdenes con formato corporativo
- **Auth + roles** vía Firebase Auth + Firestore, con switcher de rol mock para desarrollo
- **Animaciones de transición** (`motion`/Framer) entre rutas y modales

---

## Stack técnico

| Capa | Librerías |
|---|---|
| UI | React 19 · TailwindCSS 4 · `motion` · `react-icons` · `react-select` |
| Datos | Firebase (Auth + Firestore + Storage) |
| Drag & drop | `@dnd-kit/core` · `@dnd-kit/sortable` |
| Firma | `react-signature-canvas` |
| Export | `exceljs` · `file-saver` · `xlsx` |
| Charts | `@amcharts/amcharts5` + SVG nativo para sparklines |
| Routing | `react-router-dom` v7 |
| Build | Vite 7 + TypeScript 5.9 |

---

## Cómo arrancar

```bash
# instalar dependencias
npm install

# arrancar dev server
npm run dev

# build de producción
npm run build

# previsualizar build
npm run preview

# lint
npm run lint
```

### Configuración de Firebase

Crea un archivo `.env.local` en la raíz con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

En la colección `users` de Firestore, cada usuario debe tener al menos `{ role: 'superadmin' | 'admin' | 'employee' | 'client', planId, tenantId }`.

### Usuarios de prueba (mock)

| Rol | Correo | Contraseña |
|---|---|---|
| Super Admin | `superadmin@trackmysign.com` | `superadmin123` |
| Admin | `admin@shop.com` | `admin123` |
| Employee | `employee@shop.com` | `employee123` |
| Client | `client@customer.com` | `client123` |

---

## Estructura del proyecto

```
src/
├── assets/              # logos, iconos
├── components/          # componentes globales (modals, loaders, toasts)
├── context/             # AuthContext, ToastContext, PlansContext
├── features/            # lógica de dominio reutilizable entre roles
│   ├── quotes/          # cotizaciones (modelo, pricing, page, drawer)
│   ├── orders/          # órdenes + kanban + proofing
│   └── customer/        # mocks y context del cliente
├── hooks/               # useRouteTransition, etc.
├── layouts/             # layout legacy de fallback
├── pages/               # Login, Register, Landing
└── roles/               # cada rol con su layout + pages
    ├── superadmin/
    ├── admin/
    ├── employee/
    └── client/
```

---

## Convenciones

- **Diseño**: sin sombras, sin degradados, iconos sin contenedor cuando aplique. Paleta `slate-*` + acento `#1e40af`.
- **Tipografía**: Inter, tracking ajustado en titulares (`tracking-[-0.02em]`).
- **Modales**: motion fade + scale, header con bg corporativo, ESC para cerrar.
- **Commits**: conventional commits en español (`feat`, `fix`, `chore`, `refactor`).

---

## Licencia

Proyecto propietario. Todos los derechos reservados.
