import { Router } from 'express';
import { requireFeature } from '../../middlewares/feature.middleware.js';
import * as qrcodeController from './qrcode.controller.js';

/** QR Code do cardápio (MOD-09). Montado em /api/v1/admin/qrcode. */
export const qrcodeRoutes = Router();

qrcodeRoutes.use(requireFeature('qrcode'));

qrcodeRoutes.get('/', qrcodeController.getInfo);
qrcodeRoutes.get('/image.png', qrcodeController.getImage);
