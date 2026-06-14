"use client";

import { useEffect, useRef } from "react";

// Renderiza la Cajita de Pagos de Payphone.
// Al pagar, Payphone redirige a la "URL de respuesta" configurada en tu cuenta
// Payphone Developer (debe apuntar a /pago/confirmacion).
export default function PayphoneBox({
  token,
  storeId,
  amountCents,
  reference,
  clientTransactionId,
}: {
  token: string;
  storeId: string;
  amountCents: number;
  reference: string;
  clientTransactionId: string;
}) {
  const iniciado = useRef(false);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;

    // Hoja de estilos de la cajita.
    if (!document.querySelector('link[data-payphone]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css";
      link.setAttribute("data-payphone", "1");
      document.head.appendChild(link);
    }

    const render = () => {
      const PP = (window as any).PPaymentButtonBox;
      if (!PP) return false;
      new PP({
        token,
        clientTransactionId,
        amount: amountCents,
        amountWithoutTax: amountCents, // los planes no llevan impuesto
        currency: "USD",
        storeId,
        reference,
        lang: "es",
      }).render("pp-button");
      return true;
    };

    if (!render()) {
      if (!document.querySelector('script[data-payphone]')) {
        const s = document.createElement("script");
        s.type = "module";
        s.src = "https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js";
        s.setAttribute("data-payphone", "1");
        document.body.appendChild(s);
      }
      // El script es un módulo; esperamos a que exponga PPaymentButtonBox.
      const t = setInterval(() => {
        if (render()) clearInterval(t);
      }, 300);
      setTimeout(() => clearInterval(t), 10000);
    }
  }, [token, storeId, amountCents, reference, clientTransactionId]);

  return <div id="pp-button" />;
}
