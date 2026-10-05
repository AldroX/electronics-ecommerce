# EnergíaTotal

Ecommerce de soluciones energéticas para hogares y pequeños negocios en Cuba. El sitio está pensado como una capa de comercialización social y de conversión hacia WhatsApp, no como una tienda con carrito tradicional.

## Estado actual

- Astro 7 + TypeScript + Tailwind CSS 4
- Output: `server` con adapter de Vercel
- Base de datos y contenido gestionados con Supabase + Kysely
- Arquitectura preparada para catálogo, panel administrativo, analytics y contenido SEO
- Flujo principal: redes sociales -> ecommerce -> WhatsApp -> venta

## Objetivo del negocio

El proyecto no es un ecommerce estándar con checkout ni cuentas. Su objetivo es:

1. Presentar soluciones energéticas claras y rápidas.
2. Educar al usuario con lenguaje simple.
3. Convencerlo con precio, especificaciones y beneficios.
4. Llevar la conversión a WhatsApp como mecanismo principal de venta.

## Público objetivo

- Hogares con cortes de energía
- Pequeños negocios que requieren respaldo eléctrico
- Personas interesadas en energía solar y ahorro
- Usuarios con poca experiencia técnica
- Compradores principalmente móviles con conexiones lentas

## Arquitectura técnica

### Frontend

- Astro para páginas y renderizado estático/SSR controlado
- Tailwind 4 para diseño y sistema visual
- CSS modular con tema configurado mediante `src/config/theme.json`
- SEO desde el inicio con sitemap, robots, meta tags y schema

### Backend / datos

- Supabase como backend principal
- Kysely para consultas tipadas y acceso a base de datos
- Rutas API bajo `src/pages/api/` para productos, categorías, ofertas, kits, guías, FAQ, analytics y administración
- Feature flags en `src/config/features.json` para alternar entre datos estáticos o API

### Administración

- Panel de administración en `/admin`
- CRUD para productos, categorías, ofertas, kits, guías, soluciones, FAQ
- Carga de imágenes a Supabase Storage
- Gestión de métricas y márgenes

### Analytics

- Event tracking para `page_view`, `whatsapp_click` y conversiones
- Validación con HMAC para integridad de eventos
- Preparado para análisis futuro de rendimiento por producto, publicación y horario

## Estructura principal

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

## Rutas principales

- `/` — home
- `/productos` — catálogo
- `/producto/[slug]` — detalle de producto
- `/categoria/[slug]` — categoría
- `/soluciones` y `/soluciones/[slug]` — soluciones
- `/kits` — paquetes
- `/ofertas` — promociones
- `/guias` y `/guias/[slug]` — contenido educativo
- `/faq` — FAQ
- `/admin` — administración
- `/login` — autenticación
- `/api/*` — API del proyecto

## Comandos útiles

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm astro check
pnpm test
pnpm e2e
```

## Variables de entorno

El proyecto requiere estas variables en entorno local o en Vercel:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=http://localhost:4321
ANALYTICS_HMAC_SECRET=change-me
```

Recomendaciones:

- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en variables públicas.
- Mantener `.env` fuera del repositorio.
- Usar `SITE_URL` con el dominio real en producción.

## Modelo de datos

La base de datos está pensada para contenido comercial, no para un carrito clásico. Los modelos principales incluyen:

- Productos
- Categorías
- Soluciones
- Kits
- Ofertas
- Guías
- FAQ
- Page views / WhatsApp clicks / conversiones
- Registros de margen y rendimiento

Cada producto y oferta debe mantenerse con info útil para marketing y análisis comercial.

## Reglas de UX y rendimiento

- Mobile-first con foco completo en pantallas 360–430px
- Diseño simple, legible y rápido
- Carga optimizada, imágenes con tamaños responsivos
- Evitar librerías pesadas y sliders complejos
- WhatsApp como CTA principal en todas las vistas relevantes
- Explicar términos técnicos como MPPT, Wh, Ah, LiFePO4, etc.

## Flujo de usuario ideal

1. El usuario encuentra el producto desde redes sociales.
2. Llega a una página rápida y clara.
3. Comprende la solución que ofrece.
4. Revisa precio, especificaciones y uso.
5. Hace clic en WhatsApp.
6. El vendedor responde y cierra la venta.

## Desarrollo y validación

- Configuración principal del proyecto en `astro.config.mjs`
- Tema visual en `src/config/theme.json`
- Configuración app en `src/config/config.json`
- Feature flags en `src/config/features.json`
- Validación con `pnpm astro check`
- Pruebas con Vitest y Playwright

## Despliegue

El proyecto usa Vercel y el adapter `@astrojs/vercel` con `output: "server"`.

Configuración recomendada:

- Build command: `pnpm build`
- Node.js 22.12 o superior
- Dominio principal actual: `https://energiatotal.cu`
- Habilitar variables de entorno en producción y preview

## Notas importantes

- El proyecto ya tiene un enfoque comercial y técnico más avanzado que el starter inicial.
- La documentación debe mantenerse alineada con la realidad del repositorio y no seguir la plantilla por defecto de Astro.
- La estructura de datos y las rutas deben evolucionar con el negocio, pero sin perder la prioridad del flujo WhatsApp-driven.

## Onboarding rápido

### Para un nuevo desarrollador

1. Instalar dependencias: `pnpm install`
2. Copiar y preparar variables de entorno locales
3. Ejecutar `pnpm dev`
4. Revisar la documentación principal: `README.md`, `PROJECT_DOCUMENTATION.md` y `PRODUCT.md`
5. Comprobar `pnpm astro check` antes de entregar cambios

### Checklist de trabajo diario

- Revisar si el cambio afecta el flujo de WhatsApp
- Confirmar que el diseño sigue siendo mobile-first
- Verificar que la ruta o slug de producto es consistente
- No introducir dependencias pesadas ni JS innecesario
- Mantener la documentación actualizada si cambia la arquitectura

## Operación y despliegue

### Entorno local

```bash
pnpm install
pnpm dev
```

### Producción

```bash
pnpm build
```

Configuración mínima requerida:

- Node.js 22.12+
- Vercel con build por `pnpm build`
- Variables de entorno definidas para producción
- Supabase activo con storage y permisos correctos

### Verificación antes de lanzar

- Revisión de páginas clave
- Validación de URLs y slugs
- Check de WhatsApp CTA
- Verificación de analytics y env vars
- Validación de la app en preview

## Referencias

- `prompt.md` — especificación funcional y estrategia del producto
- `PRODUCT.md` — visión del producto y capacidades
- `PROJECT_DOCUMENTATION.md` — guía técnica y de trabajo del proyecto
- `src/config/` — configuración de app, tema y feature flags
- `src/pages/api/` — endpoints del backend y analytics
- `src/pages/admin/` — panel de administración
