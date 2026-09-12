from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ItemIn(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: Optional[float] = None


class VentaIn(BaseModel):
    cliente_id: Optional[int] = None
    medio_pago: str = "efectivo"
    pagado: Optional[float] = None
    observaciones: str = ""
    items: List[ItemIn]


class CompraIn(BaseModel):
    proveedor_id: Optional[int] = None
    remito: str = ""
    items: List[ItemIn]
    actualizar_precio_compra: bool = True


class AjusteIn(BaseModel):
    cantidad: int
    detalle: str = ""


class PagoIn(BaseModel):
    cliente_id: int
    monto: float
    medio: str = "efectivo"
    detalle: str = ""


class ItemOut(BaseModel):
    producto_id: int
    descripcion: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class VentaOut(BaseModel):
    id: int
    numero: str
    fecha: datetime
    cliente_id: Optional[int]
    cliente_nombre: str
    total: float
    pagado: float
    medio_pago: str
    anulada: bool
    observaciones: str
    items: List[ItemOut] = []


class CompraOut(BaseModel):
    id: int
    fecha: datetime
    proveedor_id: Optional[int]
    proveedor_nombre: str
    remito: str
    total: float
    items: List[ItemOut] = []
