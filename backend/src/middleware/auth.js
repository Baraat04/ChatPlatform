export function requireAuth(req, res, next) {
    console.log('[Auth Middleware] Checking session...', req.session ? 'session exists' : 'no session');
    if (!req.session || !req.session.userId) {
        console.log('[Auth Middleware] Unauthorized');
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    console.log('[Auth Middleware] Authorized user:', req.session.userId);
    next();
}
