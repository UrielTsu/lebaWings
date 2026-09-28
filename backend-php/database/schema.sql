-- ==========================================================
-- LEBA WINGS & BEER - BASE DE DATOS Y MENÚ OFICIAL
-- ==========================================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'Utensils',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    prep_weight TINYINT NOT NULL DEFAULT 2 COMMENT '1: Rapido (1-5min), 2: Medio (6-12min), 3: Complejo (13-25min)',
    is_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Inventario booleano: 1=Disponible, 0=Agotado',
    options_json TEXT NULL COMMENT 'JSON con opciones (ej. empanizados, salsas o sabores)',
    variants_json TEXT NULL COMMENT 'JSON con variantes (ej. Mediana / Grande)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number VARCHAR(20) NOT NULL,
    waiter_name VARCHAR(100) NOT NULL,
    status ENUM('pending', 'in_prep', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_weight INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prep_started_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    item_weight TINYINT NOT NULL DEFAULT 2,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    sauce_or_notes VARCHAR(255) NULL,
    status ENUM('pending', 'in_prep', 'ready') DEFAULT 'pending',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_orders_status ON orders(status, created_at);
CREATE INDEX idx_menu_available ON menu_items(is_available, category_id);

-- SEED: CATEGORÍAS OFICIALES LEBA WINGS & BEER
INSERT INTO categories (id, name, icon) VALUES
(1, 'Especialidades', 'Flame'),
(2, 'Extras', 'Utensils'),
(3, 'Cervezas', 'Beer'),
(4, 'Preparados de Tarro', 'GlassWater'),
(5, 'Especiales Coctelería', 'Wine'),
(6, 'Bebidas Sin Alcohol & Malteadas', 'CupSoda')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- SEED: MENÚ OFICIAL
INSERT INTO menu_items (id, category_id, name, description, price, prep_weight, is_available) VALUES
-- Especialidades
(1, 1, 'Alitas Locas', 'Empanízalas con: Takis fuego, Takis Azul, Doritos Nacho, Cheetos flaming hot o Chips Jalapeño.', 85.00, 3, 1),
(2, 1, 'Alitas Salseadas (250gr)', 'Acompañadas de palitos de pepino y zanahoria. Salsas: Original Hot, BBQ, Teriyaki Piña, Pelon Pelorico, Ajo Parmesano, Mango Habanero, Habanero, Tamarindo o Chiles Rojos.', 80.00, 2, 1),
(3, 1, 'Boneless Naturales (250gr)', 'Acompañados de palitos de pepino y zanahoria.', 90.00, 2, 1),
(4, 1, 'Boneless Salseados (250gr)', 'Acompañados de palitos de pepino y zanahoria con tu salsa artesanal preferida.', 95.00, 2, 1),

-- Extras
(5, 2, 'Papas Extra Cruji', 'Porción dorada de papas sazonadas extra crujientes.', 65.00, 1, 1),
(6, 2, '2 Banderillas con Papas', '2 banderillas con capeado dorado acompañadas de papas fritas.', 65.00, 2, 1),
(7, 2, 'Pop Corn de Pollo', 'Crujientes bocados de pollo estilo palomita.', 55.00, 1, 1),
(8, 2, 'Aros de Cebolla (12 pzs)', '12 aros de cebolla rebozados.', 55.00, 1, 1),
(9, 2, 'Dedos de Queso con Papas (7 pzs)', '7 dedos de mozzarella empanizados servidos con papas.', 110.00, 2, 1),

-- Cervezas
(10, 3, 'Corona', 'Mediana $35 / Grande $65', 35.00, 1, 1),
(11, 3, 'Victoria', 'Mediana $35 / Grande $65', 35.00, 1, 1),
(12, 3, 'Michelob Ultra', 'Mediana $40 / Grande $75', 40.00, 1, 1),
(13, 3, 'Negra Modelo', 'Mediana $40 / Grande $75', 40.00, 1, 1),
(14, 3, 'Modelo Especial', 'Mediana $40 / Grande $75', 40.00, 1, 1),
(15, 3, 'Modelo Noche Especial', 'Mediana $40', 40.00, 1, 1),
(16, 3, 'Modelo Malta', 'Mediana $40 / Grande $75', 40.00, 1, 1),
(17, 3, 'Stella Artois', 'Mediana $40 / Grande $75', 40.00, 1, 1),
(18, 3, 'Pacífico', 'Grande $85', 85.00, 1, 1),

-- Preparados de Tarro
(19, 4, 'Tarro Chelado (limón y sal)', 'Mediano $6 / Grande $12', 6.00, 1, 1),
(20, 4, 'Tarro Michelado (preparado c/salsas)', 'Mediano $10 / Grande $16', 10.00, 1, 1),
(21, 4, 'Tarro con Clamato y salsas', 'Mediano $15 / Grande $20', 15.00, 1, 1),
(22, 4, 'Tarro de Sabores', 'Manzana, Chocolate, Pepino, Mango, Fresa, Menta, Caramelo, Hawaian Island, Vainilla. Mediano $15 / Grande $25', 15.00, 1, 1),

-- Especiales Coctelería
(23, 5, 'Cholulita (470ml)', 'Cerveza con pelon y clamato.', 65.00, 1, 1),
(24, 5, 'Don Goyo (1 Lt)', 'Mezcal, cerveza, granizado (mango, tamarindo, mandarina) con pelon pelorico.', 120.00, 2, 1),
(25, 5, 'Talavera (500ml)', 'Bacardi (mango, limon, raspberry) con granizado (mango, fresa, chamoy y pelon pelorico).', 70.00, 2, 1),
(26, 5, 'Cielito Lindo (1 Lt)', 'Vodka, Curacao.', 110.00, 1, 1),
(27, 5, 'Pantera Rosa (1 Lt)', 'Vodka, Fresa.', 110.00, 1, 1),

-- Sin Alcohol & Malteadas
(28, 6, 'Refresco (355ml)', 'Lata fría 355ml.', 25.00, 1, 1),
(29, 6, 'Botella de Agua (500ml)', 'Agua purificada.', 20.00, 1, 1),
(30, 6, 'Limonada Hawaiana', 'Limonada especial tropical.', 55.00, 1, 1),
(31, 6, 'Limonada Mango', 'Con pulpa natural de mango.', 55.00, 1, 1),
(32, 6, 'Limonada Menta-Piña', 'Menta fresca y piña.', 55.00, 1, 1),
(33, 6, 'Limonada Fresa', 'Con fresa natural.', 55.00, 1, 1),
(34, 6, 'Limonada Dragon Fruit', 'Con fruta del dragón.', 55.00, 1, 1),
(35, 6, 'Malteadas Artesanales', 'Fresa, malvavisco tostado, caramelo, vainilla, chocolate, calabaza, reese''s, kisses, cookies and cream.', 70.00, 2, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), prep_weight=VALUES(prep_weight);
