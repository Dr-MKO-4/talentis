// =============================================================================
// Branche l'API simulée AVANT la création des instances axios du frontend
// d'origine (services/api.ts, employeeService.ts, recruitmentService.ts) :
//  - adaptateur axios par défaut => toutes les requêtes axios sont servies ici ;
//  - window.fetch => la page de connexion d'origine (fetch /api/v1/auth/login).
// Rien ne part sur le réseau.
// =============================================================================
import axios, { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { handle } from './server';

const API = '/api/v1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function split(url: string) {
  const u = new URL(url, window.location.origin);
  const i = u.pathname.indexOf(API);
  return { path: i >= 0 ? u.pathname.slice(i + API.length) : u.pathname, query: u.searchParams };
}

function parseBody(data: unknown) {
  if (typeof data !== 'string') return data;
  try { return JSON.parse(data); } catch { return data; }
}

const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await delay(120 + Math.random() * 180);
  const { path, query } = split(axios.getUri(config));
  const res = handle((config.method || 'get').toUpperCase(), path, query, parseBody(config.data));
  const response: AxiosResponse = { data: res.data, status: res.status, statusText: String(res.status), headers: {}, config, request: {} };
  if (res.status >= 400) throw new AxiosError(res.data?.message || 'Erreur', res.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, response);
  return response;
};

axios.defaults.adapter = adapter;

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes(API + '/')) return realFetch(input, init);
  await delay(250);
  const { path, query } = split(url);
  const res = handle((init?.method || 'GET').toUpperCase(), path, query, parseBody(init?.body));
  return new Response(JSON.stringify(res.data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
};
