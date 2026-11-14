// node --import ./lab/balance/register.mjs lab/balance/<script>.ts
import { register } from 'node:module';
register('../sim/ts-resolve.mjs', import.meta.url);
register('./patch-loader.mjs', import.meta.url);
