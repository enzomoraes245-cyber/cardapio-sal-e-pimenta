import * as passwordResetService from './password-reset.service.js';

/** Handlers de recuperação de senha de uma área ("restaurant" ou "platform"). */
export function createPasswordResetController(audience) {
  return {
    recovery(req, res) {
      res.json({ data: passwordResetService.getRecoveryOptions() });
    },

    async forgot(req, res) {
      await passwordResetService.requestPasswordReset(audience, req.validated.body.email);
      res.status(202).json({ data: { accepted: true } });
    },

    async reset(req, res) {
      await passwordResetService.resetPassword(audience, req.validated.body);
      res.status(204).end();
    },
  };
}
