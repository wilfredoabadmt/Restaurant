"use client";

export function BotonesTicket() {
  return (
    <>
      <button className="btn btn-suave" onClick={() => window.print()}>🖨 Imprimir</button>
      <button className="btn btn-suave" onClick={() => window.close()}>← cerrar</button>
    </>
  );
}
