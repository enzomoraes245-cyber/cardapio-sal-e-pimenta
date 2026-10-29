import { Router } from 'express';
import * as qrcodeController from './qrcode.controller.js';

/** QR Code do cardápio (MOD-09). Montado em /api/v1/admin/qrcode. */
export const qrcodeRoutes = Router();

qrcodeRoutes.get('/', qrcodeController.getInfo);
qrcodeRoutes.get('/image.png', qrcodeController.getImage);
