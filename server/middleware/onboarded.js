/**
 * Middleware to enforce that student users are onboarded (isOnboarded: true)
 * before they can access mutation endpoints.
 */
const enforceOnboarding = (req, res, next) => {
  if (req.user && req.user.role === "student" && !req.user.isOnboarded) {
    return res.status(403).json({ 
      error: "Onboarding required. Please complete your profile onboarding before performing this action." 
    });
  }
  next();
};

module.exports = { enforceOnboarding };
