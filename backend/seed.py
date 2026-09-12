from sqlmodel import Session, SQLModel, select

from main import engine
from models import Cliente, Producto, Proveedor

PRODUCTOS = [
    ("MAL-BOX", "Malboro Box", "Philip Morris", "atado x20", 2800, 3400, 240, 60),
    ("MAL-KS", "Malboro KS", "Philip Morris", "atado x20", 2750, 3300, 180, 60),
    ("PHI-BOX", "Philip Morris Box", "Philip Morris", "atado x20", 2500, 3050, 300, 80),
    ("LM-BLUE", "L&M Blue", "Philip Morris", "atado x20", 2300, 2800, 150, 50),
    ("PAR-SUA", "Parliament Suave", "Philip Morris", "atado x20", 3100, 3750, 90, 40),
    ("LUC-RED", "Lucky Strike Red", "BAT", "atado x20", 2600, 3150, 120, 40),
    ("CAM-BLU", "Camel Blue", "BAT", "atado x20", 2700, 3250, 60, 40),
    ("VIC-CLA", "Viceroy Clásico", "BAT", "atado x20", 2100, 2600, 200, 50),
    ("JOK-SUA", "Jockey Suave", "Massalin", "atado x20", 2200, 2700, 35, 40),
    ("CHE-100", "Chesterfield 100", "Massalin", "atado x20", 2400, 2900, 110, 40),
]

CLIENTES = [
    ("Kiosco La Esquina", "30-12345678-9", "Av. Mitre 1234", "Avellaneda", "1155550001"),
    ("Maxikiosco 24hs", "30-23456789-0", "San Martín 450", "Lanús", "1155550002"),
    ("Almacén Don Pedro", "20-34567890-1", "Belgrano 890", "Quilmes", "1155550003"),
    ("Estación Shell Ruta 2", "30-45678901-2", "Ruta 2 km 35", "Berazategui", "1155550004"),
]

PROVEEDORES = [
    ("Massalin Particulares", "30-50001234-5", "0800-1111"),
    ("British American Tobacco", "30-50005678-9", "0800-2222"),
]


def run():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        if session.exec(select(Producto)).first():
            print("La base ya tiene datos, no se cargan ejemplos")
            return
        for codigo, nombre, marca, pres, pc, pv, stock, minimo in PRODUCTOS:
            session.add(
                Producto(
                    codigo=codigo,
                    nombre=nombre,
                    marca=marca,
                    presentacion=pres,
                    unidades_por_bulto=10,
                    precio_compra=pc,
                    precio_venta=pv,
                    stock=stock,
                    stock_minimo=minimo,
                )
            )
        for nombre, cuit, dire, loc, tel in CLIENTES:
            session.add(
                Cliente(
                    nombre=nombre,
                    cuit=cuit,
                    direccion=dire,
                    localidad=loc,
                    telefono=tel,
                )
            )
        for nombre, cuit, tel in PROVEEDORES:
            session.add(Proveedor(nombre=nombre, cuit=cuit, telefono=tel))
        session.commit()
        print("Datos de ejemplo cargados")


if __name__ == "__main__":
    run()
