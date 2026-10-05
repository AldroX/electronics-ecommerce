# Documentación técnica del proyecto

## 1. Visión general

EnergíaTotal es un ecommerce orientado a soluciones energéticas para hogares y pequeños negocios en Cuba. El proyecto busca ayudar a usuarios no técnicos a entender qué producto necesitan y guiar la conversión directamente hacia WhatsApp.

No se trata de una tienda con checkout nativo ni con cuentas de usuario. La compra se realiza fuera del sitio mediante WhatsApp, que es el principal canal de venta y la llamada a la acción más importante en toda la experiencia.

## 2. Modelo de negocio

El flujo comercial es:

```text
Social media -> ecommerce -> WhatsApp -> venta -> datos
```

Esto implica que:

- Las rutas deben ser directas y compartibles desde redes sociales.
- Cada producto y cada oferta debe tener un CTA claro a WhatsApp.
- El sitio actúa como herramienta comercial y educativa, no como un storefront con carrito.
- El negocio está pensado para medir rendimiento por publicación, producto y canal.

## 3. Objetivos del producto

- Explicar soluciones energéticas con lenguaje simple.
- Velocidad y claridad por encima de visuales complejos.
- Efectividad móvil, principalmente en dispositivos pequeños.
- Conversión hacia WhatsApp con mensajes predefinidos por producto.
- Preparación para analytics y optimización comercial futura.

## 4. Público objetivo

- Hogares con cortes de energía.
- Pequeños negocios con necesidad de respaldo eléctrico.
- Personas interesadas en energía solar y paneles.
- Usuarios con poco conocimiento técnico.
- Visitantes móviles y con conexión limitada.

## 5. Requisitos funcionales principales

### Catalogo y navegación

- Catálogo de productos por categoría.
- Páginas de detalle con especificaciones, beneficios y CTA.
- Páginas de soluciones orientadas a problemas del usuario.
- Secciones de kits, ofertas y guías educativas.
- Página FAQ para resolver dudas frecuentes.

### Comercio

- Productos con precio, stock y disponibilidad.
- CTA contextual para WhatsApp: “Hola, estoy interesado en [PRODUCTO]. ¿Está disponible?”
- Ofertas con precio anterior y actual.
- Bundles para necesidades completas.

### SEO y contenido

- URLs limpias y indexables.
- Metadatos, Open Graph y sitemap.
- Páginas orientadas a soluciones, categorías y contenido educativo.
- Enfoque en contenido útil y de fácil comprensión.

## 6. Stack tecnológico

- Astro 7
- TypeScript
- Tailwind CSS 4
- Supabase
- Kysely
- Vercel adapter
- Vitest + Playwright
- ESLint + Prettier

## 7. Arquitectura técnica actual

### Frontend

El front-end se construye con Astro y está diseñado para priorizar velocidad y carga útil inmediata. El objetivo es no depender del JavaScript para mostrar contenido principal.

### Backend

El proyecto usa Supabase como capa de persistencia y API. La lógica de acceso está organizada en `src/lib/` y en rutas bajo `src/pages/api/`.

### Admin

La administración está bajo `/admin` y permite manejar los contenidos principales del ecommerce, cubriendo CRUD de productos, categorías, ofertas, guías, FAQ, kits y soluciones.

### Analytics

El sistema incorpora tracking de eventos para:

- page views
- WhatsApp clicks
- conversiones
- métricas de margen y rendimiento

## 8. Estructura de carpetas

```text
src/
  components/
  config/
  data/
  layouts/
  lib/
  pages/
  styles/
  scripts/
public/
  images/
supabase/
  migrations/
  seed/
tests/
  api/
  e2e/
  unit/
```

### Carpetas clave

- `src/config/`: configuración general, colores, feature flags, menú
- `src/data/`: información de catálogo, soluciones, ofertas, FAQ y guías
- `src/pages/`: rutas del sitio y endpoints API
- `src/pages/admin/`: panel administrativo
- `src/lib/`: lógica, validación, helpers, analytics y Supabase
- `src/styles/`: estilos globales y sistema visual

## 9. Rutas del proyecto

### Públicas

- `/`
- `/productos`
- `/producto/[slug]`
- `/categoria/[slug]`
- `/soluciones`
- `/soluciones/[slug]`
- `/kits`
- `/ofertas`
- `/guias`
- `/guias/[slug]`
- `/faq`
- `/contacto`

### Administración y autenticación

- `/admin`
- `/admin/products`
- `/login`
- `/auth/callback`

### API

- `/api/products`
- `/api/categories`
- `/api/offers`
- `/api/kits`
- `/api/guides`
- `/api/faqs`
- `/api/solutions`
- `/api/analytics/*`
- `/api/upload`
- `/api/admin/*`

## 10. Reglas de UX y diseño

### Mobile-first

La prioridad es móvil. Se debe diseñar para pantallas pequeñas, especialmente 360px, 390px y 430px, con adaptación posterior para tablet y escritorio.

### Rendimiento

- Optimizar imágenes y tamaños responsivos
- Evitar video de fondo y librerías pesadas
- Priorizar contenido útil y visible sin esperar JS
- Mantener navegabilidad y velocidad en conexiones lentas

### Jerarquía visual

- CTA claros y repetidos
- Información clave encima del pliegue
- Tarjetas limpias y legibles
- Espacios amplios y texto transparente para no técnicos

## 11. Datos y contenido

El contenido de la web debe conservarse en una estructura modular y reutilizable para poder migrar desde datos estáticos a datos dinámicos sin reescribir la interfaz completa.

Los principales bloques de contenido son:

- productos
- categorías
- soluciones
- kits
- ofertas
- FAQ
- guías
- testimonials
- analytics

## 12. Variables de entorno y configuración

### Variables mínimas

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=http://localhost:4321
ANALYTICS_HMAC_SECRET=change-me
```

### Archivos de configuración

- `src/config/config.json` — nombre del sitio, metadata, URL base
- `src/config/theme.json` — colores, tipografía y tema visual
- `src/config/menu.json` — navegación principal y footer
- `src/config/features.json` — switches de origen de datos
- `src/config/whatsapp.json` — configuración de WhatsApp

## 13. Flujo de trabajo de desarrollo

### Inicio local

```bash
pnpm install
pnpm dev
```

### Validación

```bash
pnpm astro check
pnpm test
pnpm e2e
```

### Build y despliegue

```bash
pnpm build
pnpm preview
```

## 14. Despliegue

El sitio ya está configurado para desplegarse con Vercel usando Astro adapter. Se recomienda:

- Node.js 22.12+
- `pnpm build` como comando de build
- Variables de entorno configuradas tanto en preview como en production
- Dominio canónico definido en `astro.config.mjs`

## 15. Consideraciones de negocio y estrategia

La tienda no compite por ser un marketplace tradicional. Su valor es resolver dudas, explicar beneficios y convertir a cliente con un flujo directo y transparente.

La métrica que más importa no es solo la visita, sino:

- qué producto convierte mejor,
- qué página genera más clics a WhatsApp,
- qué publicación trae más tráfico útil,
- qué solución genera más interés y demanda.

## 16. Recomendaciones para mantener documentación actualizada

- No mantener información heredada del starter de Astro.
- Documentar cambios de arquitectura en cuanto se modifiquen rutas o APIs.
- Mantener referencia de variables de entorno y permisos de acceso.
- Registrar cambios funcionales del panel administrativo y del flujo de ventas.
- Actualizar configuración del design system cuando se cambien colores, tipografías o layout.

## 17. Guía de onboarding para nuevos desarrolladores

### Objetivo

Permitir que cualquier persona nueva pueda entrar al proyecto sin depender de conocimiento informal o de la memoria del equipo.

### Requisitos previos

- Node.js 22.12 o superior
- pnpm instalado globalmente
- Acceso a la cuenta de Supabase del proyecto
- Variables de entorno configuradas localmente
- Acceso a Vercel o al entorno de despliegue asignado

### Primeros pasos

1. Clonar el repositorio.
2. Instalar dependencias con `pnpm install`.
3. Crear un archivo `.env` local con las variables necesarias.
4. Ejecutar `pnpm dev` para comprobar que la app inicia correctamente.
5. Revisar la estructura de rutas y configuración principal antes de editar.

### Qué revisar antes de tocar código

- `astro.config.mjs`
- `src/config/config.json`
- `src/config/theme.json`
- `src/config/features.json`
- `src/pages/api/`
- `src/pages/admin/`
- `src/lib/`

### Orden recomendado de lectura

1. `README.md`
2. `PROJECT_DOCUMENTATION.md`
3. `PRODUCT.md`
4. `prompt.md`
5. Configuración de rutas e integraciones
6. Flujos de producto más críticos

## 18. Flujo de trabajo recomendado

### Para cambios de contenido

- Actualizar JSON o archivos de datos según la entidad afectada.
- Mantener la estructura de productos y metadatos consistente.
- Verificar que los slugs, rutas y mensajes de WhatsApp estén sincronizados.

### Para cambios de frontend

- Revisar si el cambio impacta mobile, SEO, CTA o rendimiento.
- Probar la vista en pantallas pequeñas.
- Confirmar que no se aumentan dependencias sin necesidad.

### Para cambios de API o analytics

- Validar con Zod y tipos de respuesta.
- Confirmar que el payload y la seguridad cumplan los requisitos del flujo comercial.
- Revisar la integración con Supabase y la autenticación administrativa.

## 19. Checklist antes de merge o entrega

- La app se inicia con `pnpm dev`.
- `pnpm astro check` pasa sin errores.
- Las rutas principales se comportan como se espera.
- Los cambios no rompen el flujo de WhatsApp o la navegación móvil.
- El SEO y la metadata siguen siendo coherentes.
- Los env vars necesarios están documentados.
- No hay archivos temporales, logs o secretos en el repositorio.

## 20. Troubleshooting rápido

### La app no inicia

- Revisar si Node.js cumple la versión requerida.
- Verificar que `pnpm install` se ejecutó correctamente.
- Comprobar si faltan variables de entorno.

### Error en Supabase

- Confirmar `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.
- Revisar roles y permisos de acceso.
- Verificar que la base no esté vacía si la feature está activada en API.

### Problemas con WhatsApp o analytics

- Validar que el `ANALYTICS_HMAC_SECRET` coincida entre sistema y entorno.
- Revisar la estructura del payload enviado a los endpoints de analytics.
- Confirmar que los mensajes de WhatsApp no estén duplicados ni rotos.

## 21. Despliegue, entorno y operación en producción

### Requisitos de entorno

- Node.js 22.12+
- pnpm
- Vercel con acceso al repositorio
- Supabase configurado con base de datos y storage
- Variables definidas en producción y preview

### Configuración recomendada en producción

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=https://energiatotal.cu
ANALYTICS_HMAC_SECRET=
```

### Build y despliegue

```bash
pnpm install
pnpm build
```

En Vercel, el comando de build debe apuntar a `pnpm build` y el proyecto debe ejecutarse con Node 22.12+.

### Buenas prácticas operativas

- Hacer despliegues con cambios pequeños y verificables.
- Revisar logs de Vercel si la build falla.
- Probar previamente la app en preview antes de publicar producción.
- Guardar una copia funcional de la configuración de entorno.
- Mantener la configuración canónica del dominio en `astro.config.mjs`.

### Revisión pos-despliegue

Tras desplegar, comprobar:

- La home carga correctamente.
- Las rutas públicas responden con 200.
- Los enlaces a WhatsApp funcionan.
- Las páginas de producto y categoría renderizan sin errores.
- La administración se abre correctamente si corresponde.
- Los analytics no fallan ni reciben payloads corruptos.

## 22. Mantenimiento y evolución del proyecto

### Recomendaciones

- Mantener la documentación sincronizada con cada cambio importante.
- Registrar cambios de estructura de rutas, API, env vars y negocio.
- Mantener el foco en velocidad y claridad para usuarios móviles.
- Evitar añadir librerías costosas sin valor claro para la conversión.
- Priorizar la experiencia comercial por encima de la estética pura.

### Señales de que hay que revisar el proyecto

- Se agregan muchas rutas sin mantener el mapa de navegación claro.
- Se duplican datos entre archivos JSON y base de datos.
- La vista de producto pierde claridad para usuarios no técnicos.
- Las métricas de WhatsApp dejan de ser fáciles de medir.
- La app empieza a depender de JavaScript pesado para mostrar contenido básico.

## 22. Archivos clave para empezar a trabajar

- `astro.config.mjs`
- `package.json`
- `src/config/config.json`
- `src/config/theme.json`
- `src/config/features.json`
- `src/pages/index.astro`
- `src/pages/api/`
- `src/pages/admin/`
- `src/lib/`
- `prompt.md`
- `PRODUCT.md`

- Familia de fuentes (Inter)
- Tamaños de fuente con escala modular 1.2

### `src/config/menu.json`
- Menú principal (8 items: Inicio, Productos, Soluciones, Kits, Ofertas, Guías, FAQ, Contacto)
- Menú footer (10 items + Política y Garantía)
- Pie de página Copyright (Privacidad, Términos)

### `src/config/social.json`
- Facebook, Instagram, TikTok con enlaces y íconos

### `src/config/whatsapp.json`
- Número de teléfono
- Template de mensaje: `"Hola, estoy interesado en {product}. ¿Está disponible?"`
- Mensaje por defecto
- Horario de atención

---

## Datos (Static Initial)

### `src/data/products.json`
- 8 productos iniciales con estructura completa
- Cada producto tiene: id, name, slug, description, shortDescription, price, currency, category, images, specs, features, availability, featured, bestSeller, kitOnly, whatsappMessage, tags, seo
- Estructura preparada para futuras migraciones a DB

### `src/data/types.ts`
- Schemas Zod validation para Product, Category, Solution, Kit, Guide, FAQItem, Testimonial, Offer
- Types admin (ProductAdminListItem, ProductAdminListResponse, ProductAdminDetail)

### `src/data/categories.json`, `faq.json`, `guias.json`, `kits.json`, `ofertas.json`, `solutions.json`, `testimonials.json`

---

## Estructura de Archivos Principales

```
src/
  assets/           → imágenes y SVGs
  components/       → .astro components (13+ reusable)
  configs/          → JSON configs (theme, menu, social, whatsapp)
  data/             → JSON data (products, categories, faq, etc.)
  layouts/          → Base.astro, partials (Header, Footer)
  lib/              → analytics, api, data, db, realtime, supabase, validation
  pages/            → routes (index.astro es la única página "route")
  styles/           → CSS architecture (tailwind + generated + base + components + buttons + utilities)
  types/            → interfaces TypeScript (Product, Category, Solution, Kit, etc.)
```

---

## Scripts de Operación

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor dev en localhost:4321 (tiene themeGenerator --watch) |
| `pnpm build` | Build producción: primero themeGenerator, luego astro build |
| `pnpm preview` | Preview del build localmente |
| `pnpm astro check` | Type checking de Astro |
| `pnpm format` | Formateo Prettier |
| `pnpm audit` | Audit de seguridad de dependencias |

---

## Estado Actual de Implementación

### Ya Implementado

- Estructura Astro 7.2.7 con TypeScript estricto
- Tailwind CSS 4 con theme.json generación automática
- Layout base (Base.astro) con SEO, structured data (WebPage, Product, Breadcrumb)
- Header con navegación principal y sidebar móvil
- Footer con links, sociales y copyright
- 8 productos iniciales en `products.json` con specs completas
- Configuración de WhatsApp con mensaje contextual
- 13+ componentes reutilizables (cards, sections, UI)
- SEO básico (meta tags, open graph, twitter cards, schema.org)
- Configuración de menú principal y footer
- Estructura de rutas planeadas (12+)

### Pending / Future

- Migración de datos JSON → Base de datos PostgreSQL
- Implementación de filtros y búsqueda en `/productos`
- Páginas de producto individual (`/producto/[slug]`)
- Secciones de soluciones (`/soluciones/[slug]`)
- Kits y bundles
- Ofertas semanales con fechas de validez
- Guías educativas `/guias`
- Componentes de recomendaciones "También te puede interesar"
- Integración real con Supabase (actualmente config presente pero sin tablas)
- Validación de forms y carrito (por WhatsApp, no checkout)

---

## Migración y Mantenimiento

### Scripts disponibles

- `scripts/themeGenerator.js` — Genera `generated-theme.css` desde `theme.json`
- `scripts/migrate-json-to-db.ts` — Migración JSON → PostgreSQL
- `scripts/seed.ts` — Script de seeds/initial data
- `scripts/verify-dual-write.ts` — Verificación write dual
- `scripts/fix-faqs.ts` — Fix para FAQs
- `scripts/generate-kysely-types.ts` — Generación de tipos Kysely

### Configuración de despliegue Vercel

- Build command: `pnpm build`
- Node version: `22.x`
- Variables de entorno requeridas:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SITE_URL`
  - `ANALYTICS_HMAC_SECRET`
  - `DISABLE_EMAIL_CONFIRMATION_FOR_DEV=false`

### No comitear `.env` — está en `.gitignore`

---

## Próximos Pasos Recomendados

1. **Implementar páginas de producto** (`/producto/[slug]`) con ficha completa
2. **Crear secciones de soluciones** (`/soluciones/` y `/soluciones/[slug]`)
3. **Implementar catálogo** (`/productos`) con búsqueda, filtros, ordenamiento
4. **Conectar Supabase** tables reales (currently config only)
5. **Implementar ofertas** con fechas `validUntil`
6. **Crear guías educativas** (`/guias/`) con contenido SEO
7. **Añadir sistema de testimonios** y "social proof"
8. **Optimizar imágenes** WebP/AVIF y lazy loading en todas las tarjetas
9. **Implementar rastreo de analytics** (WhatsApp clicks, visitas por producto)
10. **Testing** en conexiones < 1 Mbps (throttling)

---

## Referencias Externas

- **Storeplate** (C:\Users\Alejandro\Projects\storeplate): Patrones CSS, sistema de themes, layout patterns a adaptar (solo CSS architecture, theme system, layout patterns — NO copiar Shopify/React code)
- **Astro Docs**: https://docs.astro.build
- **Tailwind CSS 4**: https://tailwindcss.com
- **Theme System Adaptation**: JSON → CSS variables pattern from storeplate

---
*Documentación generada basada en prompt.md (812 lines) y estructura codebase actual.*