import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, create_engine, func, select

from models import (
    Cliente,
    Compra,
    CompraItem,
    MovimientoStock,
    Pago,
    Producto,
    Proveedor,
    Venta,
    VentaItem,
)
from schemas import (
    AjusteIn,
    CompraIn,
    CompraOut,
    ItemOut,
    PagoIn,
    VentaIn,
    VentaOut,
)

DB_PATH = os.getenv("DB_PATH") or (
    "/data/distri.db" if os.path.isdir("/data") else "distri.db"
)
engine = create_engine(
    f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False}
)

app = FastAPI(title="Distribuidora - Stock y Facturacion")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_session():
    with Session(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    if os.getenv("SEED_ON_STARTUP", "1") == "1":
        from seed import run as cargar_ejemplos

        cargar_ejemplos()


def registrar_movimiento(
    session: Session, producto: Producto, tipo: str, cantidad: int, detalle: str
):
    producto.stock += cantidad
    session.add(producto)
    session.add(
        MovimientoStock(
            producto_id=producto.id,
            tipo=tipo,
            cantidad=cantidad,
            stock_resultante=producto.stock,
            detalle=detalle,
        )
    )


# ---------------- Productos ----------------


@app.get("/api/productos", response_model=List[Producto])
def listar_productos(
    q: str = "", solo_bajos: bool = False, session: Session = Depends(get_session)
):
    stmt = select(Producto).where(Producto.activo == True)  # noqa: E712
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Producto.nombre.like(like))
            | (Producto.codigo.like(like))
            | (Producto.marca.like(like))
        )
    productos = session.exec(stmt.order_by(Producto.nombre)).all()
    if solo_bajos:
        productos = [p for p in productos if p.stock <= p.stock_minimo]
    return productos


@app.post("/api/productos", response_model=Producto)
def crear_producto(producto: Producto, session: Session = Depends(get_session)):
    existente = session.exec(
        select(Producto).where(Producto.codigo == producto.codigo)
    ).first()
    if existente:
        raise HTTPException(400, "Ya existe un producto con ese código")
    producto.id = None
    session.add(producto)
    session.commit()
    session.refresh(producto)
    if producto.stock:
        registrar_movimiento(session, producto, "alta", 0, "Stock inicial")
        session.commit()
    return producto


@app.put("/api/productos/{producto_id}", response_model=Producto)
def editar_producto(
    producto_id: int, datos: Producto, session: Session = Depends(get_session)
):
    producto = session.get(Producto, producto_id)
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    for campo, valor in datos.dict(exclude={"id", "stock"}, exclude_unset=True).items():
        setattr(producto, campo, valor)
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto


@app.delete("/api/productos/{producto_id}")
def baja_producto(producto_id: int, session: Session = Depends(get_session)):
    producto = session.get(Producto, producto_id)
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    producto.activo = False
    session.add(producto)
    session.commit()
    return {"ok": True}


@app.post("/api/productos/{producto_id}/ajuste", response_model=Producto)
def ajustar_stock(
    producto_id: int, ajuste: AjusteIn, session: Session = Depends(get_session)
):
    producto = session.get(Producto, producto_id)
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    if producto.stock + ajuste.cantidad < 0:
        raise HTTPException(400, "El ajuste deja stock negativo")
    registrar_movimiento(
        session, producto, "ajuste", ajuste.cantidad, ajuste.detalle or "Ajuste manual"
    )
    session.commit()
    session.refresh(producto)
    return producto


@app.get("/api/productos/{producto_id}/movimientos", response_model=List[MovimientoStock])
def movimientos_producto(producto_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(MovimientoStock)
        .where(MovimientoStock.producto_id == producto_id)
        .order_by(MovimientoStock.id.desc())
    ).all()


# ---------------- Clientes / Proveedores ----------------


@app.get("/api/clientes", response_model=List[Cliente])
def listar_clientes(q: str = "", session: Session = Depends(get_session)):
    stmt = select(Cliente).where(Cliente.activo == True)  # noqa: E712
    if q:
        stmt = stmt.where(Cliente.nombre.like(f"%{q}%"))
    return session.exec(stmt.order_by(Cliente.nombre)).all()


@app.post("/api/clientes", response_model=Cliente)
def crear_cliente(cliente: Cliente, session: Session = Depends(get_session)):
    cliente.id = None
    session.add(cliente)
    session.commit()
    session.refresh(cliente)
    return cliente


@app.put("/api/clientes/{cliente_id}", response_model=Cliente)
def editar_cliente(
    cliente_id: int, datos: Cliente, session: Session = Depends(get_session)
):
    cliente = session.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    for campo, valor in datos.dict(exclude={"id", "saldo"}, exclude_unset=True).items():
        setattr(cliente, campo, valor)
    session.add(cliente)
    session.commit()
    session.refresh(cliente)
    return cliente


@app.delete("/api/clientes/{cliente_id}")
def baja_cliente(cliente_id: int, session: Session = Depends(get_session)):
    cliente = session.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    cliente.activo = False
    session.add(cliente)
    session.commit()
    return {"ok": True}


@app.get("/api/proveedores", response_model=List[Proveedor])
def listar_proveedores(session: Session = Depends(get_session)):
    return session.exec(
        select(Proveedor).where(Proveedor.activo == True).order_by(Proveedor.nombre)  # noqa: E712
    ).all()


@app.post("/api/proveedores", response_model=Proveedor)
def crear_proveedor(proveedor: Proveedor, session: Session = Depends(get_session)):
    proveedor.id = None
    session.add(proveedor)
    session.commit()
    session.refresh(proveedor)
    return proveedor


# ---------------- Ventas ----------------


def proximo_numero(session: Session) -> str:
    total = session.exec(select(func.count(Venta.id))).one()
    return f"0001-{total + 1:08d}"


def armar_venta_out(session: Session, venta: Venta) -> VentaOut:
    items = session.exec(
        select(VentaItem).where(VentaItem.venta_id == venta.id)
    ).all()
    return VentaOut(
        **venta.dict(),
        items=[ItemOut(**i.dict(exclude={"id", "venta_id"})) for i in items],
    )


@app.get("/api/ventas", response_model=List[VentaOut])
def listar_ventas(
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    cliente_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    stmt = select(Venta)
    if desde:
        stmt = stmt.where(Venta.fecha >= datetime.fromisoformat(desde))
    if hasta:
        stmt = stmt.where(Venta.fecha <= datetime.fromisoformat(hasta))
    if cliente_id:
        stmt = stmt.where(Venta.cliente_id == cliente_id)
    ventas = session.exec(stmt.order_by(Venta.id.desc())).all()
    return [armar_venta_out(session, v) for v in ventas]


@app.get("/api/ventas/{venta_id}", response_model=VentaOut)
def ver_venta(venta_id: int, session: Session = Depends(get_session)):
    venta = session.get(Venta, venta_id)
    if not venta:
        raise HTTPException(404, "Venta no encontrada")
    return armar_venta_out(session, venta)


@app.post("/api/ventas", response_model=VentaOut)
def crear_venta(datos: VentaIn, session: Session = Depends(get_session)):
    if not datos.items:
        raise HTTPException(400, "La venta no tiene items")

    cliente = session.get(Cliente, datos.cliente_id) if datos.cliente_id else None
    if datos.medio_pago == "cuenta_corriente" and not cliente:
        raise HTTPException(400, "Cuenta corriente requiere un cliente")

    venta = Venta(
        numero=proximo_numero(session),
        cliente_id=cliente.id if cliente else None,
        cliente_nombre=cliente.nombre if cliente else "Consumidor final",
        medio_pago=datos.medio_pago,
        observaciones=datos.observaciones,
    )
    session.add(venta)
    session.commit()
    session.refresh(venta)

    total = 0.0
    for item in datos.items:
        producto = session.get(Producto, item.producto_id)
        if not producto:
            raise HTTPException(404, f"Producto {item.producto_id} no encontrado")
        if item.cantidad <= 0:
            raise HTTPException(400, "Cantidad inválida")
        if producto.stock < item.cantidad:
            raise HTTPException(
                400, f"Stock insuficiente de {producto.nombre} (disponible {producto.stock})"
            )
        precio = (
            item.precio_unitario
            if item.precio_unitario is not None
            else producto.precio_venta
        )
        subtotal = round(precio * item.cantidad, 2)
        total += subtotal
        session.add(
            VentaItem(
                venta_id=venta.id,
                producto_id=producto.id,
                descripcion=f"{producto.nombre} {producto.presentacion}".strip(),
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=subtotal,
            )
        )
        registrar_movimiento(
            session, producto, "venta", -item.cantidad, f"Comprobante {venta.numero}"
        )

    venta.total = round(total, 2)
    venta.pagado = (
        datos.pagado
        if datos.pagado is not None
        else (0.0 if datos.medio_pago == "cuenta_corriente" else venta.total)
    )
    if cliente:
        cliente.saldo = round(cliente.saldo + (venta.total - venta.pagado), 2)
        session.add(cliente)
    session.add(venta)
    session.commit()
    session.refresh(venta)
    return armar_venta_out(session, venta)


@app.post("/api/ventas/{venta_id}/anular", response_model=VentaOut)
def anular_venta(venta_id: int, session: Session = Depends(get_session)):
    venta = session.get(Venta, venta_id)
    if not venta:
        raise HTTPException(404, "Venta no encontrada")
    if venta.anulada:
        raise HTTPException(400, "La venta ya está anulada")
    items = session.exec(select(VentaItem).where(VentaItem.venta_id == venta.id)).all()
    for item in items:
        producto = session.get(Producto, item.producto_id)
        if producto:
            registrar_movimiento(
                session,
                producto,
                "anulacion",
                item.cantidad,
                f"Anulación {venta.numero}",
            )
    if venta.cliente_id:
        cliente = session.get(Cliente, venta.cliente_id)
        if cliente:
            cliente.saldo = round(cliente.saldo - (venta.total - venta.pagado), 2)
            session.add(cliente)
    venta.anulada = True
    session.add(venta)
    session.commit()
    session.refresh(venta)
    return armar_venta_out(session, venta)


# ---------------- Compras ----------------


@app.get("/api/compras", response_model=List[CompraOut])
def listar_compras(session: Session = Depends(get_session)):
    compras = session.exec(select(Compra).order_by(Compra.id.desc())).all()
    salida = []
    for compra in compras:
        items = session.exec(
            select(CompraItem).where(CompraItem.compra_id == compra.id)
        ).all()
        salida.append(
            CompraOut(
                **compra.dict(),
                items=[ItemOut(**i.dict(exclude={"id", "compra_id"})) for i in items],
            )
        )
    return salida


@app.post("/api/compras", response_model=CompraOut)
def crear_compra(datos: CompraIn, session: Session = Depends(get_session)):
    if not datos.items:
        raise HTTPException(400, "La compra no tiene items")
    proveedor = (
        session.get(Proveedor, datos.proveedor_id) if datos.proveedor_id else None
    )
    compra = Compra(
        proveedor_id=proveedor.id if proveedor else None,
        proveedor_nombre=proveedor.nombre if proveedor else "Sin proveedor",
        remito=datos.remito,
    )
    session.add(compra)
    session.commit()
    session.refresh(compra)

    total = 0.0
    items_out = []
    for item in datos.items:
        producto = session.get(Producto, item.producto_id)
        if not producto:
            raise HTTPException(404, f"Producto {item.producto_id} no encontrado")
        if item.cantidad <= 0:
            raise HTTPException(400, "Cantidad inválida")
        precio = (
            item.precio_unitario
            if item.precio_unitario is not None
            else producto.precio_compra
        )
        subtotal = round(precio * item.cantidad, 2)
        total += subtotal
        compra_item = CompraItem(
            compra_id=compra.id,
            producto_id=producto.id,
            descripcion=f"{producto.nombre} {producto.presentacion}".strip(),
            cantidad=item.cantidad,
            precio_unitario=precio,
            subtotal=subtotal,
        )
        session.add(compra_item)
        items_out.append(ItemOut(**compra_item.dict(exclude={"id", "compra_id"})))
        if datos.actualizar_precio_compra and item.precio_unitario is not None:
            producto.precio_compra = precio
        registrar_movimiento(
            session,
            producto,
            "compra",
            item.cantidad,
            f"Compra {datos.remito or compra.id}",
        )

    compra.total = round(total, 2)
    session.add(compra)
    session.commit()
    session.refresh(compra)
    return CompraOut(**compra.dict(), items=items_out)


# ---------------- Cuenta corriente ----------------


@app.post("/api/pagos", response_model=Cliente)
def registrar_pago(datos: PagoIn, session: Session = Depends(get_session)):
    cliente = session.get(Cliente, datos.cliente_id)
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    if datos.monto <= 0:
        raise HTTPException(400, "Monto inválido")
    session.add(
        Pago(
            cliente_id=cliente.id,
            monto=datos.monto,
            medio=datos.medio,
            detalle=datos.detalle,
        )
    )
    cliente.saldo = round(cliente.saldo - datos.monto, 2)
    session.add(cliente)
    session.commit()
    session.refresh(cliente)
    return cliente


@app.get("/api/clientes/{cliente_id}/pagos", response_model=List[Pago])
def pagos_cliente(cliente_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(Pago).where(Pago.cliente_id == cliente_id).order_by(Pago.id.desc())
    ).all()


# ---------------- Demo ----------------


@app.post("/api/demo/reset")
def reiniciar_demo(session: Session = Depends(get_session)):
    """Borra todo y vuelve a cargar los datos de ejemplo (para demostraciones)."""
    from seed import run as cargar_ejemplos

    for modelo in (
        VentaItem,
        Venta,
        CompraItem,
        Compra,
        MovimientoStock,
        Pago,
        Producto,
        Cliente,
        Proveedor,
    ):
        for fila in session.exec(select(modelo)).all():
            session.delete(fila)
    session.commit()
    cargar_ejemplos()
    return {"ok": True}


# ---------------- Dashboard ----------------


@app.get("/api/dashboard")
def dashboard(session: Session = Depends(get_session)):
    hoy = datetime.utcnow().date()
    inicio_dia = datetime.combine(hoy, datetime.min.time())
    inicio_mes = datetime.combine(hoy.replace(day=1), datetime.min.time())

    ventas = session.exec(select(Venta).where(Venta.anulada == False)).all()  # noqa: E712
    ventas_hoy = [v for v in ventas if v.fecha >= inicio_dia]
    ventas_mes = [v for v in ventas if v.fecha >= inicio_mes]

    productos = session.exec(
        select(Producto).where(Producto.activo == True)  # noqa: E712
    ).all()
    bajos = [p for p in productos if p.stock <= p.stock_minimo]
    clientes = session.exec(
        select(Cliente).where(Cliente.activo == True)  # noqa: E712
    ).all()

    desde_semana = datetime.utcnow() - timedelta(days=6)
    items_semana = session.exec(
        select(VentaItem, Venta)
        .where(VentaItem.venta_id == Venta.id)
        .where(Venta.anulada == False)  # noqa: E712
        .where(Venta.fecha >= desde_semana)
    ).all()
    ranking: dict[str, int] = {}
    for item, _ in items_semana:
        ranking[item.descripcion] = ranking.get(item.descripcion, 0) + item.cantidad
    top = sorted(ranking.items(), key=lambda x: -x[1])[:5]

    return {
        "ventas_hoy": round(sum(v.total for v in ventas_hoy), 2),
        "cantidad_ventas_hoy": len(ventas_hoy),
        "ventas_mes": round(sum(v.total for v in ventas_mes), 2),
        "valor_stock": round(sum(p.stock * p.precio_compra for p in productos), 2),
        "productos_activos": len(productos),
        "stock_bajo": [
            {"id": p.id, "nombre": p.nombre, "stock": p.stock, "minimo": p.stock_minimo}
            for p in bajos
        ],
        "deuda_total": round(sum(c.saldo for c in clientes if c.saldo > 0), 2),
        "deudores": [
            {"id": c.id, "nombre": c.nombre, "saldo": c.saldo}
            for c in sorted(clientes, key=lambda c: -c.saldo)
            if c.saldo > 0
        ][:5],
        "mas_vendidos": [{"descripcion": d, "cantidad": c} for d, c in top],
    }
