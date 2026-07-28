-- Run these ALTER TABLE statements manually if drizzle-kit push fails.

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS product_category_id_idx ON products(category_id);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS category_slug_idx ON categories(slug);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS product_image_product_id_idx ON product_images(product_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS cart_user_product_idx ON cart_items(user_id, product_id);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  shipping_address TEXT NOT NULL,
  phone VARCHAR(20),
  notes TEXT,
  payment_method VARCHAR(20) DEFAULT 'qris',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  payment_proof TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS order_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS order_item_order_id_idx ON order_items(order_id);
