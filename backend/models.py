from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Producto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(index=True, unique=True)
    nombre: str
    marca: str = ""
    presentacion: str = ""  # atado, box x10, etc.
    unidades_por_bulto: int = 1
    precio_compra: float = 0.0
    precio_venta: float = 0.0
    stock: int = 0
    stock_minimo: int = 0
    activo: bool = True


class Cliente(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    cuit: str = ""
    direccion: str = ""
    localidad: str = ""
    telefono: str = ""
    saldo: float = 0.0
    activo: bool = True


class Proveedor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    cuit: str = ""
    telefono: str = ""
    activo: bool = True


class Venta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    numero: str = Field(index=True)
    fecha: datetime = Field(default_factory=datetime.utcnow)
    cliente_id: Optional[int] = Field(default=None, foreign_key="cliente.id")
    cliente_nombre: str = ""
    total: float = 0.0
    pagado: float = 0.0
    medio_pago: str = "efectivo"  # efectivo, transferencia, cuenta_corriente
    anulada: bool = False
    observaciones: str = ""


class VentaItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    venta_id: int = Field(foreign_key="venta.id", index=True)
    producto_id: int = Field(foreign_key="producto.id")
    descripcion: str = ""
    cantidad: int = 1
    precio_unitario: float = 0.0
    subtotal: float = 0.0


class Compra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=datetime.utcnow)
    proveedor_id: Optional[int] = Field(default=None, foreign_key="proveedor.id")
    proveedor_nombre: str = ""
    remito: str = ""
    total: float = 0.0


class CompraItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    compra_id: int = Field(foreign_key="compra.id", index=True)
    producto_id: int = Field(foreign_key="producto.id")
    descripcion: str = ""
    cantidad: int = 1
    precio_unitario: float = 0.0
    subtotal: float = 0.0


class MovimientoStock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=datetime.utcnow)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    tipo: str  # compra, venta, ajuste, anulacion
    cantidad: int  # positivo entrada, negativo salida
    stock_resultante: int = 0
    detalle: str = ""


class Pago(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=datetime.utcnow)
    cliente_id: int = Field(foreign_key="cliente.id", index=True)
    monto: float = 0.0
    medio: str = "efectivo"
    detalle: str = ""
