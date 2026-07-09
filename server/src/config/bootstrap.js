import User from '../models/User.js';

const demoUsers = [
  {
    name: 'Kunal Admin',
    email: 'kunal@gmail.com',
    passwordHash: '2212Aryan@3',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    title: 'Platform Admin',
    bio: 'Building the future of productivity.',
    location: 'Mumbai, India',
    skills: ['React', 'Node.js', 'MongoDB', 'Productivity']
  },
  {
    name: 'Aryan User',
    email: 'aryan@gmail.com',
    passwordHash: '0902@Aryan3',
    role: 'user',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
    title: 'Software Developer',
    bio: 'Building awesome things.',
    location: 'Mumbai, India',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
  }
];

export const seedIfEmpty = async () => {
  const count = await User.countDocuments();
  if (count > 0) return;

  for (const data of demoUsers) {
    await User.create(data);
  }
  console.log('Seeded demo users (database was empty).');
};
