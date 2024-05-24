-- Create Table Fruits
CREATE TABLE IF NOT EXISTS public.fruits
(
    id character varying(255) COLLATE pg_catalog."default" NOT NULL DEFAULT nextval('fruits_id_seq'::regclass),
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    buying_price numeric(10,2) NOT NULL DEFAULT 0,
    selling_price numeric(10,2) NOT NULL DEFAULT 0,
    quantity integer NOT NULL DEFAULT 0,
    CONSTRAINT fruits_pkey PRIMARY KEY (id)
);

-- Create Table BillStocks
CREATE TABLE IF NOT EXISTS public.bill_stocks
(
    id character varying(255) COLLATE pg_catalog."default",
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL
);

-- Create Table SellingStocks
CREATE TABLE IF NOT EXISTS public.selling_stocks
(
    id character varying(255) COLLATE pg_catalog."default" NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    quantity integer NOT NULL,
    buying_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    profit numeric(10,2) NOT NULL,
    CONSTRAINT selling_stocks_pkey PRIMARY KEY (id)
);

-- Insert Demo Data for Fruits table
INSERT INTO public.fruits (id, name, buying_price, selling_price, quantity) VALUES
('DFS001', 'Apple', 100.00, 150.00, 30),
('DFS002', 'Banana', 100.00, 150.00, 96),
('DFS003', 'Blueberries', 100.00, 150.00, 50),
('DFS004', 'Cherimoya', 90.00, 120.00, 19),
('DFS005', 'Cherries', 100.00, 130.00, 70),
('DFS006', 'Custard Apple', 60.00, 80.00, 30),
('DFS007', 'Date Fruit', 140.00, 180.00, 88),
('DFS008', 'Elderberries', 90.00, 110.00, 49),
('DFS009', 'Feijoa', 60.00, 80.00, 50),
('DFS010', 'Gooseberries', 100.00, 150.00, 85),
('DFS011', 'Grapefruit', 130.00, 160.00, 110),
('DFS012', 'Guava', 90.00, 110.00, 100),
('DFS013', 'Jackfruit', 30.00, 50.00, 70),
('DFS014', 'Java Plum', 60.00, 80.00, 60),
('DFS015', 'Kumquat', 50.00, 70.00, 50);
