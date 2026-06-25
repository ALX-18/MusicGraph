// Middleware d'erreurs centralisé.
// Toute erreur passée à next(err) atterrit ici et ressort en { error } + code HTTP.

// 404 pour les routes inconnues (monté avant l'errorHandler).
export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} introuvable` });
}

// eslint-disable-next-line no-unused-vars — la signature à 4 args est requise par Express.
export function errorHandler(err, req, res, next) {
  // Un status posé explicitement (ex: 400 depuis parsePagination, 404 métier) est respecté.
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: err.message || 'Erreur interne du serveur',
  });
}
