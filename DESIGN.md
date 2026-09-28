---
version: alpha
name: "Kollab Koncepts"
description: "Bandeja operativa para casos técnicos con identidad granate y rojo."
colors:
  primary: "#cf1f27"
  canvas: "#722F37"
  surface: "#f7f4f4"
  text: "#241f1f"
  danger: "#7a1f2b"
typography:
  sans:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
omitted:
  - section: rounded
    reason: "Los radios actuales se mantienen en las clases Tailwind de los componentes."
  - section: spacing
    reason: "Las separaciones actuales se mantienen en las clases Tailwind de los componentes."
---

# Diseño de Kollab Koncepts

## Overview

Interfaz operativa en español para clientes, técnicos y administradores. La ficha y la bandeja priorizan lectura, estado y acciones sobre decoración. El granate del marco identifica el producto; el rojo se reserva para controles y estados destacados.

## Tokens y propietarios

Los colores y la tipografía se implementan en `src/styles/globals.css`; este documento registra su intención. Las superficies y componentes compartidos viven en `src/components` y el marco de navegación en `src/layouts/AppShell.jsx`.

## Adaptación móvil

En la bandeja técnica cada caso se lee como una tarjeta con las mismas acciones y datos de la tabla. La navegación inferior muestra tres destinos frecuentes y el acceso «Más» abre el menú completo.

## Acceso

Registro e inicio de sesión conservan las tarjetas y campos existentes. La confirmación de seguridad se presenta como segundo paso en la misma tarjeta; el QR es la acción principal y la clave manual queda disponible como alternativa. Ambos se retiran de la pantalla después de vincular la cuenta.
