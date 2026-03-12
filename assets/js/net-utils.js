/**
 * net-utils.js — Utilidades de red IPv4 puras
 * Compartidas por subnetting-vlsm.html y subnetting-practica-final.html
 *
 * Funciones exportadas (globales):
 *   str(o)            — Array de 4 octetos → cadena "a.b.c.d"
 *   prefixToMask(p)   — Prefijo /p → array de máscara [255,255,255,0]
 *   wildcard(m)       — Array de máscara → wildcard [0,0,0,255]
 *   netAddr(ip, m)    — AND bit a bit → dirección de red
 *   broadcast(net,wc) — Red + wildcard → broadcast
 *   addOne(o)         — Incrementa IP en 1
 *   subOne(o)         — Decrementa IP en 1
 *   usable(p)         — Hosts útiles para prefijo p  (2^(32-p) - 2)
 *   normIP(s)         — Parsea y valida cadena IP; devuelve "a.b.c.d" o null
 *   ri(min, max)      — Entero aleatorio en [min, max]
 */

'use strict';

function str(o) { return o.join('.'); }

function prefixToMask(p) {
  p = Math.max(0, Math.min(32, p | 0));   // clamp to [0,32], coerce to int
  return Array.from({length: 4}, (_, i) => {
    const b = Math.min(8, Math.max(0, p - i * 8));
    return b === 8 ? 255 : b === 0 ? 0 : 256 - Math.pow(2, 8 - b);
  });
}

function wildcard(m)       { return m.map(x => 255 - x); }
function netAddr(ip, m)    { return ip.map((b, i) => b & m[i]); }
function broadcast(net,wc) { return net.map((b, i) => b + wc[i]); }

function addOne(o) {
  const n = (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0) + 1;
  if (n > 0xFFFFFFFF) return [255, 255, 255, 255]; // clamp at max
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

function subOne(o) {
  const n = (((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0) - 1;
  if (n < 0) return [0, 0, 0, 0]; // clamp at min
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

function usable(p) { return Math.pow(2, 32 - p) - 2; }

function normIP(s) {
  if (!s) return null;
  const parts = s.trim().replace(/\s+/g, '.').replace(/,/g, '.').split('.');
  if (parts.length !== 4) return null;
  const n = parts.map(p => parseInt(p, 10));
  if (n.some(x => isNaN(x) || x < 0 || x > 255)) return null;
  return n.join('.');
}

function ri(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
