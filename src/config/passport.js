const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email        = profile.emails[0].value;
        const googleId     = profile.id;
        const name         = profile.displayName;
        const avatar       = profile.photos?.[0]?.value || "";

        // 1. Already signed up with Google before → just return them
        let user = await User.findOne({ googleId });
        if (user) return done(null, user);

        // 2. Email exists but registered locally → link Google to that account
        user = await User.findOne({ email });
        if (user) {
          user.googleId     = googleId;
          user.authProvider = "google";
          if (!user.avatar) user.avatar = avatar;
          await user.save();
          return done(null, user);
        }

        // 3. Brand new user → create account but mark profile as incomplete
        //    Role will be chosen on the frontend and sent via /api/auth/google/set-role
        user = await User.create({
          name,
          email,
          avatar,
          googleId,
          authProvider:      "google",
          isProfileComplete: false, // role not chosen yet
          role:              "user",  // temp default, overwritten after role selection
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Passport session serialization (only used internally for the OAuth redirect flow)
passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;