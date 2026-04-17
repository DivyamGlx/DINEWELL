// auth.js stub
module.exports = (req, res, next) => {
    // In a real system, this would verify JWT
    // For testing, we assume user is already attached or we skip verification
    req.user = { id: 1, role: 'admin', username: 'admin' };
    next();
};
