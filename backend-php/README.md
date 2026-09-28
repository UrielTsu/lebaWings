# Backend REST API en PHP - Leba Wings

## Requisitos
- PHP 8.1 o superior con extensiones `pdo_mysql` o `pdo_sqlite`.
- Servidor Web (Nginx / Apache) o PHP Built-in Server para desarrollo.
- Base de datos MySQL / MariaDB o SQLite.

## Instalación Rápida
1. Importar el archivo SQL:
   ```bash
   mysql -u root -p leba_wings < database/schema.sql
   ```
2. Iniciar servidor de desarrollo en la carpeta `public/`:
   ```bash
   cd backend-php
   php -S 0.0.0.0:8000 -t public
   ```
3. Endpoints Principales:
   - `GET  /api/menu?only_available=true` : Catálogo con filtro booleano para meseros.
   - `PATCH /api/menu/{id}/toggle-stock` : Alternar disponibilidad Disponible/Agotado.
   - `PATCH /api/menu/{id}/weight` : Asignar peso de preparación (1 a 3).
   - `POST /api/orders` : Recepción atómica y validada de comandas.
   - `GET  /api/orders/kitchen-queue` : Cola de cocina ordenada por PriorityScore dinámico.
   - `PATCH /api/orders/{id}/status` : Actualización de estado en cocina.
