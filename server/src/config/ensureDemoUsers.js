import User from '../models/User.js';
import { demoUsers } from './demoUsers.js';

export const ensureDemoUsers = async () => {
  const demoEmails = demoUsers.map((user) => user.email.trim().toLowerCase());

  await User.deleteMany({ email: { $nin: demoEmails } });

  for (const demoUser of demoUsers) {
    const { password, ...profile } = demoUser;
    const email = profile.email.trim().toLowerCase();
    let user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      user = new User({
        ...profile,
        email,
        passwordHash: password
      });
    } else {
      Object.assign(user, profile, { email });
      user.passwordHash = password;
      user.markModified('passwordHash');
    }

    await user.save();
  }

  console.log('Demo accounts ready:');
  for (const { email, password, role } of demoUsers) {
    console.log(`  ${role}: ${email.trim().toLowerCase()} / ${password}`);
  }
};
