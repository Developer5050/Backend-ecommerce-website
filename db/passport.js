const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("../models/userModel");
const bcrypt = require("bcrypt")

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile Data:", profile);

      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email exists with another provider
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.googleDisplayName = profile.displayName;
            user.name = profile.displayName;
            await user.save();
          } else {
            user = await User.create({
              googleId: profile.id,
              googleDisplayName: profile.displayName,
              name: profile.displayName,
              email: profile.emails[0].value,
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10)
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
